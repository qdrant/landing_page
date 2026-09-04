---
title: Zero-Downtime Rolling Upgrades
short_description: "Upgrade a Qdrant StatefulSet on Kubernetes without downtime, and see exactly what breaks when replication factor is set to 1."
description: "Tutorial: perform a zero-downtime rolling upgrade of Qdrant on Kubernetes, and measure why replication factor 1 causes read and write failures during the same upgrade."
aliases:
  - /documentation/tutorials/rolling-upgrades/
weight: 37
---

# Zero-Downtime Rolling Upgrades

| Time: 40 min | Level: Intermediate | Stack: Kubernetes |
| :---- | :---- | :---- |

Upgrading Qdrant on Kubernetes with `helm upgrade` triggers the StatefulSet's default `RollingUpdate` strategy: pods get replaced one at a time, in reverse ordinal order, and Kubernetes waits for each replacement to become ready before touching the next one. 

There is, nevertheless, one setting in your Qdrant collections that mainly determines whether the update will have zero downtime, or it will cause some disruptions: `replication_factor`.

This tutorial upgrades a 3-node Qdrant cluster twice: once with `replication_factor: 2`, and once with `replication_factor: 1`, showing setup, differences and failures on both the read and write path.

## Prerequisites

- A Kubernetes cluster. This tutorial uses [kind](https://kind.sigs.k8s.io/) to run one locally.
- `kubectl` and `helm` installed.
- The [Qdrant Helm chart](https://github.com/qdrant/qdrant-helm) repository added: `helm repo add qdrant https://qdrant.github.io/qdrant-helm`.

## How Rolling Updates Work

A StatefulSet's `RollingUpdate` strategy replaces pods highest-ordinal-first: in a 3-node cluster, `qdrant-upgrade-2` terminates and restarts first, then `qdrant-upgrade-1`, then `qdrant-upgrade-0`. Each pod must pass its readiness probe before the next one is touched. 

This is the same primitive the Custom Resource Definition-based [Qdrant Operator](/documentation/hybrid-cloud/operator-configuration/) relies on. The operator adds guardrails on top of it, such as blocking multi-minor-version skips and coordinating shard rebalancing, but the underlying pod replacement is the same rolling update.

Zero downtime during that replacement depends mostly on your collections having `replication_factor` greater than 1. A search request needs to reach one active replica of every shard in a collection, since the default `consistency` of 1 does not tolerate a missing shard. A write only needs to reach the replica set of the one shard that owns the point being written. 

With `replication_factor: 1`, taking any pod down takes its shards fully offline, so every search that touches that shard fails and every write whose point ID hashes to that shard fails. With `replication_factor: 2`, as long as the two replicas of each shard live on different pods, the surviving replica keeps serving while the other one restarts.

## Step 1: Create the Cluster and Deploy Qdrant

Create a local Kubernetes cluster and deploy a 3-node Qdrant cluster:

```shell
kind create cluster --name qdrant-upgrade-demo
helm upgrade --install qdrant-upgrade qdrant/qdrant -f values.yaml
```

`values.yaml` pins the starting version:

```yaml
replicaCount: 3
image:
  tag: "v1.18.0"
```

Confirm all 3 pods are running the pinned image and are ready:

```shell
kubectl get pod qdrant-upgrade-0 -o jsonpath='{.spec.containers[0].image}'
kubectl get pods
```

<aside role="alert">
The Helm chart's post-install notes always print the chart version, for example "Qdrant v1.19.0 has been deployed successfully", regardless of the image tag you actually deployed. Trust <code>kubectl get pod ... -o jsonpath='{.spec.containers[0].image}'</code> for the real running version.
</aside>

## Step 2: Create a Collection with Replication Factor 2

Port-forward to the cluster and create a collection with `replication_factor: 2`:

```shell
kubectl port-forward svc/qdrant-upgrade 6333:6333 > /dev/null 2>&1 &

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
kubectl run pytest --image=python:3.11-slim --restart=Never -- sleep 3600
kubectl exec -it pytest -- pip install requests
```

Seed one point you can check for later, then start a loop that alternates a write and a read every half second, logging the HTTP status and any error text for both:

```shell
kubectl exec -it pytest -- python3 -c "
import requests
requests.put('http://qdrant-upgrade:6333/collections/upgrade_test/points', json={
    'points': [{'id': 1, 'vector': [0.1, 0.2, 0.3, 0.4], 'payload': {'label': 'anchor'}}]
})
print('seeded anchor point')
"

kubectl exec -it pytest -- python3 -c "
import requests, random, time, datetime

url = 'http://qdrant-upgrade:6333/collections/upgrade_test'
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

    print(f'{ts} - write={w.status_code} read={r.status_code} top_hit_id={top_id}')
    i += 1
    time.sleep(0.5)
" >> logs_rf_2.log
```

Leave this running in its own terminal for the rest of the tutorial.

## Step 4: Run the Upgrade

From another terminal, apply `upgrade-values.yaml`, which bumps the image tag:

```shell
helm upgrade --install qdrant-upgrade qdrant/qdrant -f upgrade-values.yaml
```

```yaml
replicaCount: 3
image:
  tag: "v1.19.0"
```

Watch the pods cycle one at a time, highest ordinal first:

```shell
kubectl get pods -w
```

## Step 5: Check the Results at Replication Factor 2

Once all 3 pods report the new image and are ready, stop the traffic loop and check `logs_rf_2.log`. Every line reads `write=200 read=200` for the full duration of the upgrade, including while `qdrant-upgrade-2`, `-1`, and `-0` were each terminating and restarting in turn. No request failed and the anchor point seeded in step 3 is still there:

```shell
kubectl exec -it pytest -- python3 -c "
import requests
r = requests.get('http://qdrant-upgrade:6333/collections/upgrade_test/points/1')
print(r.json())
"
```

![Shard placement across the 3 pods, replication_factor: 1 vs. replication_factor: 2, while one pod restarts](/documentation/tutorials/rolling-upgrades/shard-availability.png)

## Step 6: Repeat at Replication Factor 1

Recreate the collection with `replication_factor: 1`, re-seed the anchor point, and restart the same traffic loop against a fresh `logs_rf_1.log`. Roll the image tag back to `v1.18.0` and upgrade forward to `v1.19.0` again to reproduce the same pod cycling. This time, the log shows failures clustered around whichever pod is mid-restart:

```text
10:37:51 - write=500 read=500 top_hit_id=None
  read_error: "...Failed to connect to http://qdrant-upgrade-2.qdrant-upgrade-headless:6335/, error: transport error..."
10:37:53 - write=200 read=500 top_hit_id=None
  read_error: "...dns error: failed to lookup address information: Name or service not known..."
10:38:17 - write=500 read=500 top_hit_id=None
  read_error: "...error trying to connect: tcp connect error: Connection refused (os error 111)..."
```

Every failure in the log names the same pod, `qdrant-upgrade-2`, for the entire window it was down. That is the signature of a single unavailable replica, not a general cluster problem.

**Every search fails while the affected pod is down.** A search must reach a replica of every shard in the collection. With `replication_factor: 1`, the shard that lives on the down pod has no fallback replica, so the whole search fails, including the results the other two shards would have returned fine.

**Only some writes fail, in proportion to the shard count.** A write only fails if the point's ID hashes to the shard hosted on the down pod. In this run, 4 writes failed against 14 reads, out of 132 total requests, consistent with a write having a 1-in-`shard_count` chance of landing on the affected shard while every read has 100% exposure to it.

![Why a down pod fails every search but only some writes, at replication_factor: 1](/documentation/tutorials/rolling-upgrades/read-write-blast-radius.png)

The error text itself changes three times for what is the same event: a transport error, then a DNS lookup failure, then a connection refused. As a pod moves through terminating, gone, and not-yet-ready, each stage produces a different error shape for the same underlying fact, that the replica is not currently reachable. Do not read these as three separate bugs.

## What This Does Not Cover

This raw StatefulSet rolling update has no guardrails against a multi-minor-version skip, and it does not coordinate shard rebalancing beyond what Kubernetes' own readiness gating provides. The [Qdrant Operator](/documentation/hybrid-cloud/operator-configuration/) wraps this same rolling update with those checks for production use.

Replication factor 2 is also not sufficient by itself. Verify that the two replicas of each shard actually landed on different pods, for example with `kubectl get pods -o wide` and the [Collection Cluster info API](https://api.qdrant.tech/master/api-reference/distributed/collection-cluster-info), rather than assuming it. Restart one node at a time, not in parallel; a `RollingUpdate` strategy already enforces this. Collection and cluster metadata operations, such as creating a collection, go through Raft consensus and need a majority of nodes reachable regardless of shard-level replication.

## Related Reading

- [Qdrant Operator](/documentation/hybrid-cloud/operator-configuration/) for the CRD-based upgrade path with additional guardrails.
- [Distributed Deployment](/documentation/scaling/distributed_deployment/) for how sharding and replication factor interact.
- [Blue-Green Cluster Deployment](/documentation/tutorials-operations/blue-green-deployment/) for testing a version upgrade on a separate cluster before committing production traffic to it.
