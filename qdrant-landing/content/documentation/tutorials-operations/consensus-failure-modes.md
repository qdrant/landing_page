---
title: Diagnosing Consensus Failure Modes
short_description: "Understand how a Qdrant cluster behaves during network partitions and node loss, and how to recover it."
description: "Reproduce network partitions in a Qdrant cluster with Chaos Mesh, read Raft consensus state to diagnose what's actually happening, and recover a cluster that has lost a node permanently."
aliases:
  - /documentation/tutorials/consensus-failure-modes/
weight: 36
---

# Diagnosing Consensus Failure Modes

| Time: 45 min | Level: Advanced |
| :---- | :---- |

Qdrant uses [Raft](/documentation/scaling/horizontal-scaling/#raft-consensus) for distributed consensus: cluster metadata, such as collection configuration and shard placement, is replicated through a Raft log, and a leader is elected among the nodes holding a copy of that log. Point data replication is a separate mechanism, but if consensus itself is stuck, no structural change to the cluster can commit, including the writes that depend on it.

This tutorial reproduces network partitions against a real Qdrant cluster so you can see:

- A healthy quorum loss
- A _split-brain_ scenario
- How to read the `/cluster` endpoint to tell these failure modes apart
- How to recover a healthy state when a peer isn't recoverable

This tutorial runs entirely on a local, disposable cluster. Deliberately partitioning nodes with Chaos Mesh means breaking real network connectivity between pods, which is a reasonable thing to do on a `kind` cluster you can throw away, and a much riskier thing to do against infrastructure you don't fully control the networking layer of, such as a Qdrant Hybrid Cloud environment running on your own cloud provider's nodes. A short note on how the final recovery step differs on Hybrid Cloud follows at the end.

## Prerequisites

- A Kubernetes cluster. This tutorial uses [kind](https://kind.sigs.k8s.io/) for a local, disposable cluster.
- [Helm](https://helm.sh/) and `kubectl`.
- [Chaos Mesh](https://chaos-mesh.org/), to inject network partitions.
- `jq`, to read JSON responses.

## Raft Basics You Need Here

A Raft cluster of `N` nodes needs a strict majority, `floor(N/2) + 1`, to elect a leader or commit anything. For 5 nodes, that's 3. This tutorial uses 5 nodes because it's a reasonable size where a partition can split the cluster into a majority and a minority, which is the scenario worth diagnosing.

Each node exposes its Raft state at `GET /cluster`, under `result.raft_info`:

```json
{
  "term": 1,
  "commit": 15,
  "pending_operations": 0,
  "leader": 8277395301898904,
  "role": "Leader",
  "is_voter": true
}
```

- `term` increases every time a node starts an election. A node that can't win keeps calling new elections, so a climbing term with no matching leader is a sign of a stuck minority, not a healthy cluster.
- `role` is `Leader`, `Follower`, or `Candidate`. Candidate means the node believes there is no leader and is trying to become one.
- `commit` is the index of the last committed log entry. It only moves forward when a majority has acknowledged an entry.
- `is_voter` tells you whether the node counts toward quorum at all, which matters once you start removing nodes.

`result.message_send_failures` lists the peers a node currently can't reach, which is how you confirm a partition boundary instead of guessing at it from symptoms.

## Set Up the Cluster

Create a disposable Kubernetes cluster and deploy Qdrant with 5 replicas:

```shell
kind create cluster --name qdrant-consensus-demo

helm repo add qdrant https://qdrant.github.io/qdrant-helm
helm repo update
helm upgrade --install qdrant-consensus-demo qdrant/qdrant -f values.yaml
```

```yaml
# values.yaml

replicaCount: 5
```

Wait for all 5 pods to be `Running` with `kubectl get pods`, then poll their Raft state:

```shell
check_nodes_status () {
  for i in 0 1 2 3 4; do
    port=$((6340 + i))
    kubectl port-forward qdrant-consensus-demo-$i $port:6333 > /dev/null 2>&1 &
    pf_pid=$!
    sleep 1
    echo "=== node $i (local port $port) ==="
    curl -s http://localhost:$port/cluster | jq '.result.raft_info'
    kill $pf_pid
  done
}

check_nodes_status
```

Every node should agree on the same `term`, `leader`, and `commit`.

## Failure Mode 1: Losing a Node Within Quorum

Delete one follower pod and watch the cluster route around it:

```shell
kubectl delete pod qdrant-consensus-demo-1
```

The remaining 4 nodes still have a majority of the original 5, so consensus keeps working without interruption. Kubernetes restarts the pod from the StatefulSet, and once it rejoins, it catches up to the current `commit` and resumes as a normal follower. This is the case Raft is designed to absorb without any intervention: as long as a majority stays reachable, losing a minority of nodes is a non-event.

<aside role="status">
A minority loss inside quorum needs no manual intervention. The cluster keeps working, and the recovered node catches up on its own.
</aside>

## Failure Mode 2: A Partition That Preserves a Majority

Install Chaos Mesh to inject a real network partition, not just a pod restart:

```shell
helm repo add chaos-mesh https://charts.chaos-mesh.org
helm repo update
helm install chaos-mesh chaos-mesh/chaos-mesh \
  -n chaos-mesh \
  --create-namespace \
  --set chaosDaemon.runtime=containerd \
  --set chaosDaemon.socketPath=/run/containerd/containerd.sock
```

<aside role="alert">
<code>chaosDaemon.runtime</code> has to match your node's actual container runtime, or the daemon fails with a misleading "unable to flush ip sets" error instead of an obvious mismatch error. kind runs on containerd, so set it explicitly rather than relying on the chart default.
</aside>

Split the 5 nodes into a group of 3 (0, 1, 2) and a group of 2 (3, 4), blocking traffic in both directions between them:

```shell
kubectl apply -f qdrant-split-brain.yaml
```

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: qdrant-split-brain
spec:
  action: partition
  mode: all
  selector:
    pods:
      default:
        - qdrant-consensus-demo-0
        - qdrant-consensus-demo-1
        - qdrant-consensus-demo-2
  direction: both
  target:
    selector:
      pods:
        default:
          - qdrant-consensus-demo-3
          - qdrant-consensus-demo-4
    mode: all
  duration: "120s"
```

Poll `raft_info`, `consensus_thread_status`, and `message_send_failures` together while the partition is active:

```shell
check_node_status_extra () {
  for i in 0 1 2 3 4; do
    port=$((6340 + i))
    kubectl port-forward qdrant-consensus-demo-$i $port:6333 > /dev/null 2>&1 &
    pf_pid=$!
    sleep 1
    echo "=== node $i (local port $port) ==="
    curl -s http://localhost:$port/cluster | jq '.result.raft_info, .result.consensus_thread_status, .result.message_send_failures'
    kill $pf_pid 2>/dev/null
  done
}
```

![A 5-node cluster split into a 3-node majority that keeps its term and leader unchanged, and a 2-node minority stuck as candidates with a climbing term](/documentation/tutorials/consensus-failure-modes/partition-3-2.png)

The two sides behave completely differently:

**The majority side (0, 1, 2)** stays untouched. `term`, `leader`, and `commit` don't move. Only the leader shows entries in `message_send_failures`, because in normal Raft operation only the leader talks directly to every follower. Followers not showing failures doesn't mean they're unaware of the partition. It means they were never contacting the other side in the first place.

**The minority side (3, 4)** goes loud: both nodes flip to `role: Candidate` with `leader: 0`, meaning they've given up on the old leader and are calling elections. Their `term` climbs independently on each node, and the two terms drift apart from each other, because each node increments its own counter on every failed election and they can't agree with each other about the outcome.

They can't win: even if nodes 3 and 4 voted for each other, that's 2 votes against a required 3 out of 5. They're locked out of leadership for as long as the partition holds, and they will keep spending resources on elections the entire time.

<aside role="status">
A node that can't reach a majority doesn't wait patiently. It calls elections indefinitely and its term climbs without bound, which is your signal that a node is in a minority partition rather than merely slow or unreachable.
</aside>

### Recovery

Once the partition heals, either by waiting out the `duration` or deleting the `NetworkChaos` resource, check `raft_info` again:

```shell
kubectl delete networkchaos qdrant-split-brain
check_nodes_status
```

All 5 nodes converge on the same term, but **not necessarily on the same leader as before the partition**. This is the part that might not be intuitive: Raft's rule is that any node that observes a higher term than its own immediately steps down, if it was leader, and adopts that higher term. Term recency wins over incumbency, with no exception for who held office before.

During the partition, nodes 3 and 4 kept incrementing their term on every failed election, so by the time the partition heals they're carrying a term far ahead of the majority side's. When connectivity returns, the majority observes that higher term and a real, whole-cluster election happens, not just a resume. One of the previously partitioned nodes can win it, as long as its log isn't stale.

You can confirm a real election happened by watching `commit` advance by exactly one: a new Raft leader commits a no-op entry immediately on taking office, specifically to establish that its view of the log is authoritative before accepting new writes.

<aside role="status">
A healed partition does not guarantee the same leader you had before. If the minority side spent the outage aggressively re-electing, its inflated term can win the post-recovery election outright. The cluster ends up consistent and correct, just not necessarily led by the same node.
</aside>

![Before and after a partition heals: nodes with a stable low term next to nodes with an inflated term from repeated elections, then all nodes converging on the higher term with a new leader](/documentation/tutorials/consensus-failure-modes/re-election-after-partition.png)

## Failure Mode 3: A Partition with No Majority Anywhere

Some partitions leave no side with quorum at all. Split the 5 nodes three ways, into {0, 1}, {2}, and {3, 4}, with `three-way-partition.yaml`:

```shell
kubectl apply -f three-way-partition.yaml
```

```yaml
# isolate {0,1} from {2}
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: partition-a-b
  namespace: default
spec:
  action: partition
  mode: all
  selector:
    pods:
      default:
        - qdrant-consensus-demo-0
        - qdrant-consensus-demo-1
  direction: both
  target:
    selector:
      pods:
        default:
          - qdrant-consensus-demo-2
    mode: all
  duration: "180s"
---
# isolate {0,1} from {3,4}
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: partition-a-c
  namespace: default
spec:
  action: partition
  mode: all
  selector:
    pods:
      default:
        - qdrant-consensus-demo-0
        - qdrant-consensus-demo-1
  direction: both
  target:
    selector:
      pods:
        default:
          - qdrant-consensus-demo-3
          - qdrant-consensus-demo-4
    mode: all
  duration: "180s"
---
# isolate {2} from {3,4}
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: partition-b-c
  namespace: default
spec:
  action: partition
  mode: all
  selector:
    pods:
      default:
        - qdrant-consensus-demo-2
  direction: both
  target:
    selector:
      pods:
        default:
          - qdrant-consensus-demo-3
          - qdrant-consensus-demo-4
    mode: all
  duration: "180s"
```

None of the three groups has 3 nodes, so none can elect a leader on its own, but the groups don't fail identically:

- **{0, 1} and {2}** behave like the minority side in the previous scenario: climbing terms, `role: Candidate`, calling elections that can never win.
- **{3, 4}**, since one of them was already the leader elected in a previous test, stays completely calm. `term` doesn't move, and the leader keeps reporting `role: Leader` with no errors.

Despite seemingly not failing, the last group is the dangerous one: a Raft leader doesn't proactively check whether it still commands a majority, it just keeps sending heartbeats to whichever followers it can still reach, and a follower that keeps receiving heartbeats has no reason to call an election.

The result is a node that reports `role: Leader` with complete confidence while commanding only 2 votes out of 5, nowhere near a majority of the real cluster.

<aside role="status">
<code>role: Leader</code> alone is not sufficient evidence that a node is safe to trust for writes. A stranded leader looks identical to a healthy one from its own point of view. Cross-check <code>role</code> against the rest of the cluster, or against actual write progress, before treating a single node's self-report as authoritative.
</aside>

![Three-way partition into groups of 2, 1, and 2 nodes: the first two groups climb their term with no leader, while the third group keeps a calm, unchanged term and a confident leader despite having no quorum](/documentation/tutorials/consensus-failure-modes/three-way-partition.png)

### How Partitioned Nodes See Writes

Sending a write to each node during the three-way split shows the practical consequence of the two failure shapes:

```shell
for i in 0 1 2 3 4; do
  port=$((6340 + i))
  kubectl port-forward qdrant-consensus-demo-$i $port:6333 > /dev/null 2>&1 &
  pf_pid=$!
  sleep 1
  curl -X PUT "http://localhost:${port}/collections/test_collection" \
    --header "Content-Type: application/json" \
    --data-raw '{"vectors": {"size": 384, "distance": "Cosine"}}' | jq
  kill $pf_pid 2>/dev/null
done
```

Nodes that have a leader but no quorum, in the {3, 4} group, hang and eventually return:

```json
{"status": {"error": "Service internal error: Waiting for consensus operation commit failed. Timeout set at: 10 seconds"}}
```

Nodes with no leader at all, in {0, 1} and {2}, return a different error:

```json
{"status": {"error": "Service internal error: Failed to propose operation: leader is not established within 10s"}}
```

Neither group commits the write. The stranded leader's `role: Leader` status does not translate into an ability to do anything: any write against it blocks until it times out, because it can never get the majority acknowledgment Raft requires to commit.

This is the concrete cost of trusting `role` alone: a client talking only to node 3 or 4 would see a healthy-looking leader and a write that silently fails after 10 seconds.

Clean up before continuing:

```shell
for i in a-b a-c b-c; do
  kubectl delete networkchaos partition-$i
done
```

## Recovering the Unrecoverable

A partition heals on its own, but a node that's fully gone, for example a lost volume or a decommissioned host, needs to be manually removed from the Raft cluster, or the remaining nodes will keep trying to reach a peer that will never respond.

Simulate this by deleting a node's pod and its underlying storage, then scaling the StatefulSet down by one immediately, so Kubernetes doesn't get the chance to recreate the pod with a fresh, empty volume before you can observe the failure:

```shell
kubectl delete pod qdrant-consensus-demo-4
kubectl delete pvc qdrant-storage-qdrant-consensus-demo-4
kubectl scale statefulset qdrant-consensus-demo --replicas=4
```

Check the leader's state. It keeps counting failed messages to the peer that will never come back:

```json
{
  "raft_info": {"term": 1, "commit": 20, "leader": 5763063190104270, "role": "Leader"},
  "message_send_failures": {
    "http://qdrant-consensus-demo-4.qdrant-consensus-demo-headless:6335/": {
      "count": 274,
      "latest_error": "...transport error"
    }
  }
}
```

The rest of the cluster still has quorum, 4 out of the original 5, so it keeps working, but the dead peer stays in the Raft peer list until you remove it explicitly.

Look up its peer ID, then delete it hitting the `DELETE /cluster/peer/:id` endpoint:

```shell
kubectl port-forward qdrant-consensus-demo-0 6333:6333 > /dev/null 2>&1 &
sleep 1

peer_id=$(curl -s http://localhost:6333/cluster \
  | jq -r '.result.peers | to_entries[] | select(.value.uri | contains("qdrant-consensus-demo-4.")) | .key')

curl -s -X DELETE "http://localhost:6333/cluster/peer/${peer_id}"
kill %1 2>/dev/null
```

Which returns a response confirming the deletion:

```json
{"result": true, "status": "ok", "time": 0.029972527}
```

If the peer still holds shard allocations from before it went down, this call can be rejected instead. See [Node Failure Recovery](/documentation/scaling/node-failure-recovery/) for the `force` flag that handles that case.

<aside role="status">
On Qdrant Hybrid Cloud, the peer removal call above works the same way, since it hits Qdrant's own HTTP API directly and the Operator doesn't sit in front of it. Scaling down does not work directly with kubectl, so you need to do it through the Qdrant Cloud console instead, which is the sanctioned path for changing cluster size on Hybrid Cloud.
</aside>

Check `message_send_failures` again. The failure count for that peer stops increasing, and `latest_error_timestamp` stops advancing, since the cluster no longer tries to reach it:

```json
{
  "raft_info": {"term": 1, "commit": 23, "leader": 5763063190104270, "role": "Leader"},
  "message_send_failures": {
    "http://qdrant-consensus-demo-4.qdrant-consensus-demo-headless:6335/": {
      "count": 2214,
      "latest_error_timestamp": "2026-09-01T16:23:03.096527467Z"
    }
  }
}
```

That stale, no-longer-advancing timestamp is your confirmation that removal succeeded. The peer entry itself may linger in some views since it once existed, but the cluster has stopped waiting on it, and quorum is now computed against the 4 remaining nodes.

## Summary

| Situation | `role` on the affected nodes | Term behavior | Can it write? |
| :---- | :---- | :---- | :---- |
| Node lost, majority intact | Followers unaffected | Stable | Yes |
| Partitioned minority | `Candidate`, no leader | Climbs indefinitely | No, times out waiting for a leader |
| Partitioned leader stranded without quorum | `Leader`, confidently | Stable | No, times out waiting for consensus commit |
| Node permanently gone, not yet removed | Rest of cluster unaffected | Stable | Yes, but failures accumulate against the dead peer |

The single rule to carry away: **never trust `role: Leader` in isolation**. Confirm it against the rest of the cluster, or against whether writes actually commit, before you treat a node as authoritative.

And when a node is truly gone rather than temporarily partitioned, remove its peer entry explicitly with `DELETE /cluster/peer/{peer_id}` rather than waiting for it to reappear.
