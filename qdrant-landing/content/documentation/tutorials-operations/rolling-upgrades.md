---
title: Zero-Downtime Rolling Upgrades
short_description: "Upgrade a Qdrant cluster on Kubernetes without downtime, and see exactly what breaks when replication factor is set to 1."
description: "Perform a zero-downtime rolling upgrade of a Qdrant Hybrid Cloud cluster on Kubernetes, and measure why replication factor 1 causes read and write failures during the same upgrade."
aliases:
  - /documentation/tutorials/rolling-upgrades/
weight: 37
---

# Zero-Downtime Rolling Upgrades

| Time: 40 min | Level: Intermediate | Stack: Kubernetes, Qdrant Hybrid Cloud |
| :---- | :---- | :---- |

Upgrading a Qdrant Hybrid Cloud cluster triggers the StatefulSet's default `RollingUpdate` strategy under the hood: pods get replaced one at a time, in reverse ordinal order, and Kubernetes waits for each replacement to become ready before touching the next one.

There is, nevertheless, one setting in your Qdrant collections that mainly determines whether the update will have zero downtime, or it will cause some disruptions: `replication_factor`.

This tutorial upgrades a 2-node Qdrant Hybrid Cloud cluster twice: once with `replication_factor: 2`, and once with `replication_factor: 1`, showing setup, differences and failures on both the read and write path.

## Prerequisites

- A [Qdrant Hybrid Cloud](/documentation/hybrid-cloud/) cluster running on a Kubernetes cluster with 3 nodes, deployed through the [Qdrant Operator](/documentation/hybrid-cloud/operator-configuration/).
- `kubectl` installed, with a context pointing at that Kubernetes cluster.
- The [`qcloud` CLI](/documentation/cloud-cli/) installed and authenticated against your account: `qcloud context set hybrid-cloud --account-id <account-id> --api-key <management-api-key>`.

## How Rolling Updates Work

A StatefulSet's `RollingUpdate` strategy replaces pods highest-ordinal-first: in a 3-node cluster, the pod with ordinal 2 terminates and restarts first, then the pod with ordinal 1, and eventually the one with ordinal 0. Each pod must pass its readiness probe before the next one is touched.

The [Qdrant Operator](/documentation/hybrid-cloud/operator-configuration/) that runs a Hybrid Cloud cluster relies on this same primitive, and adds guardrails on top of it, such as blocking multi-minor-version skips and coordinating shard rebalancing. The underlying pod replacement is still the same rolling update, triggered here through `qcloud cluster update` instead of `helm upgrade` (which you would use for a fully self-hosted cluster).

Zero downtime during that replacement depends mostly on your collections having `replication_factor` greater than 1. A search request needs to reach one active replica of every shard in a collection, since the default `consistency` of 1 does not tolerate a missing shard. A write only needs to reach the replica set of the one shard that owns the point being written. 

With `replication_factor: 1`, taking any pod down takes its shards fully offline, so every search that touches that shard fails and every write whose point ID hashes to that shard fails. With `replication_factor: 2`, as long as the two replicas of each shard live on different pods, the surviving replica keeps serving while the other one restarts.

## Step 1: Set Up the Cluster and Confirm the Starting Version

Create a Hybrid Cloud cluster on 3 nodes from the Cloud UI, pinned to a starting version such as `v1.18.3`. Set `KUBENS` and `SERVICE_NAME` to your cluster's namespace and StatefulSet service name, both visible in the Cloud UI:

```shell
KUBENS="qdrant-hybrid-test"
SERVICE_NAME="qdrant-<cluster-id>"
kubectl get pod "${SERVICE_NAME}-0" -o jsonpath='{.spec.containers[0].image}' -n $KUBENS
```

Confirm the output shows `v1.18.3`, then confirm all pods are ready:

```shell
kubectl get pods -n $KUBENS
```

## Step 2: Create a Collection with Replication Factor 2

Port-forward to the cluster and create a collection with `replication_factor: 2`:

```shell
kubectl port-forward svc/${SERVICE_NAME} 6333:6333 -n $KUBENS > /dev/null 2>&1 &

COLLECTION_NAME="upgrade_test"
curl -X PUT "http://localhost:6333/collections/${COLLECTION_NAME}" \
  -H "Content-Type: application/json" \
  -d '{"vectors": {"size": 4, "distance": "Cosine"}, "replication_factor": 2}'
```

## Step 3: Generate Continuous Traffic from Inside the Cluster

Run the traffic generator from a pod inside the cluster, not through `kubectl port-forward` on your machine. Port-forwarding picks one pod and sticks to it for the life of the connection, so it does not represent how a real client behaves, and it fails outright the moment that one pod restarts. 

A pod running inside the cluster talks to the Qdrant Service instead, and each request is a fresh connection: kube-proxy's iptables mode [picks a backend at random per new connection](https://kubernetes.io/docs/reference/networking/virtual-ips/#proxy-mode-iptables), so requests spread across whichever of the 3 pods are currently ready and correctly skip whichever pod is mid-restart.

Start a test pod and install its one dependency:

```shell
kubectl run pytest --image=python:3.11-slim --restart=Never -n $KUBENS -- sleep 3600
kubectl exec -it pytest -n $KUBENS -- pip install requests
```

Seed one point you can check for later, then start a loop that alternates a write and a read every half second, logging the HTTP status and any error text for both:

```shell
kubectl exec -it pytest -n $KUBENS -- python3 -c "
import requests
requests.put('http://${SERVICE_NAME}:6333/collections/upgrade_test/points', json={
    'points': [{'id': 1, 'vector': [0.1, 0.2, 0.3, 0.4], 'payload': {'label': 'anchor'}}]
})
print('seeded anchor point')
"

kubectl exec -it pytest -n $KUBENS -- python3 -c "
import requests, random, time, datetime

url = 'http://${SERVICE_NAME}:6333/collections/upgrade_test'
i = 2
while True:
    ts = datetime.datetime.now().strftime('%H:%M:%S')
    vec = [random.random() for _ in range(4)]

    w = requests.put(f'{url}/points', json={'points': [{'id': i, 'vector': vec, 'payload': {'seq': i}}]})
    r = requests.post(f'{url}/points/search', json={'vector': vec, 'limit': 3, 'with_payload': True})

    write_ok = w.status_code == 200
    read_ok = r.status_code == 200
    found = r.json().get('result', []) if read_ok else []
    top_id = found[0]['id'] if found else None
    read_error = '' if read_ok else 'read_error=' + r.text
    write_error = '' if write_ok else 'write_error=' + w.text

    print(f'{ts} - write={w.status_code} read={r.status_code} top_hit_id={top_id} {read_error} {write_error}')
    i += 1
    time.sleep(0.5)
" >> logs_rf_2.log
```

Leave this running in its own terminal for the rest of the tutorial.

## Step 4: Run the Upgrade

Hybrid Cloud clusters are not upgraded with `helm upgrade` directly. From another terminal, trigger the upgrade through the `qcloud` CLI, giving it your cluster ID and target version:

```shell
CLUSTER_ID="<cluster-id>"
qcloud cluster update $CLUSTER_ID --version v1.19.0
```

Watch the pods cycle one at a time, highest ordinal first:

```shell
kubectl get pods -n $KUBENS -w
```

## Step 5: Check the Results at Replication Factor 2

Once all pods report the new image and are ready, stop the traffic loop and check `logs_rf_2.log`. Every line reads `write=200 read=200` for the full duration of the upgrade, including while each pod was terminating and restarting in turn. No request failed and the anchor point seeded in Step 3 is still there:

```shell
kubectl exec -it pytest -n $KUBENS -- python3 -c "
import requests
r = requests.get('http://${SERVICE_NAME}:6333/collections/upgrade_test/points/1')
print(r.json())
"
```

![Shard placement across the 3 pods, replication_factor: 1 vs. replication_factor: 2, while one pod restarts](/documentation/tutorials/rolling-upgrades/shard-availability.png)

## Step 6: Repeat at Replication Factor 1

Recreate the collection with `replication_factor: 1`, re-seed the anchor point, and restart the same traffic loop against a fresh `logs_rf_1.log`. Roll the cluster back to `v1.18.3` with `qcloud cluster update` and upgrade forward to `v1.19.0` again to reproduce the same pod cycling. This time, the loop stalls the moment the pod holding the collection's only shard replica goes down, and the Python client surfaces a raw connection failure instead of an HTTP status:

```text
09:35:34 - write=200 read=200 top_hit_id=16
09:35:35 - write=200 read=200 top_hit_id=17
Traceback (most recent call last):
  ...
ConnectionRefusedError: [Errno 111] Connection refused
  ...
requests.exceptions.ConnectionError: HTTPConnectionPool(host='qdrant-<cluster-id>', port=6333): Max retries exceeded with url: /collections/upgrade_test/points (Caused by NewConnectionError("...Failed to establish a new connection: [Errno 111] Connection refused"))
09:36:06 - write=200 read=200 top_hit_id=2
09:36:06 - write=200 read=200 top_hit_id=3
```

If you resume the crashed client once the pod comes back, Kubernetes' Service routes traffic to it again. There is no partial-failure window here the way `replication_factor: 2` would show one: with a single replica per shard, the pod restart takes the whole collection off the Service's endpoint list for as long as that one pod is unready, so both writes and reads stop rather than degrading gradually.

**Every request fails while the pod that owns the shard is down.** With `replication_factor: 1`, there is no surviving replica to route around, so the client sees a connection refused rather than a clean HTTP error from Qdrant itself. A collection sharded across more of the cluster would only lose the writes and searches that touch the affected shard, not the whole collection; see [What This Does Not Cover](#what-this-does-not-cover) below.

Do not read the traceback as an application bug. It is `requests` reporting that the one pod serving that shard was, for those roughly 30 seconds, not accepting connections at all.

## What This Does Not Cover

This collection used the default shard count, so with `replication_factor: 1` the one shard and its one replica live on a single pod, and the whole collection goes offline while that pod restarts. A collection split across more shards would only lose the requests that touch the shard on the down pod, not every request; the [Distributed Deployment](/documentation/scaling/distributed_deployment/) page covers how `shard_number` and `replication_factor` interact.

Replication factor 2 is also not sufficient by itself. Verify that the two replicas of each shard actually landed on different pods, for example with `kubectl get pods -n $KUBENS -o wide` and the [Collection Cluster info API](https://api.qdrant.tech/master/api-reference/distributed/collection-cluster-info), rather than assuming it. Restart one node at a time, not in parallel; a `RollingUpdate` strategy already enforces this. Collection and cluster metadata operations, such as creating a collection, go through Raft consensus and need a majority of nodes reachable regardless of shard-level replication.

## Related Reading

- [Qdrant Operator](/documentation/hybrid-cloud/operator-configuration/) for the CRD-based upgrade path with additional guardrails.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) for how sharding and replication factor interact.
- [Blue-Green Cluster Deployment](/documentation/tutorials-operations/blue-green-deployment/) for testing a version upgrade on a separate cluster before committing production traffic to it.
