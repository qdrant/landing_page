---
title: Upgrades
short_description: "Upgrade Qdrant safely on Cloud, Kubernetes, or Docker with rolling restarts, replica-aware planning, and SDK compatibility checks."
description: "Upgrade Qdrant clusters across Cloud, Kubernetes, Docker, and Compose with rolling restarts, version compatibility rules, and zero-downtime planning."
partition: deploy
weight: 140
aliases:
  - /documentation/upgrades
  - /documentation/operations/upgrades
---

# Upgrading Qdrant

If you are several versions behind, multiple updates might be required to reach the latest version. When upgrading Qdrant, upgrade to the latest patch version of each intermediate minor version first. For example, if you are running version 1.15 and want to upgrade to 1.17, you must first upgrade all cluster nodes to 1.16.3 before upgrading to 1.17. A Qdrant node with version 1.17 will be compatible with a node with version 1.16, but not with a node with version 1.15. If you run a single node cluster, you also cannot skip versions to ensure that all data migrations are properly applied. Qdrant Cloud does this automatically for you.

If all collections of a cluster have a replication factor of at least **2**, the update process will be zero-downtime as long as you restart the Qdrant nodes in a rolling fashion. This means that you should restart the nodes one after another, allowing the cluster to maintain availability during the update process. If you have a single-node cluster or a collection with a replication factor of **1**, the update process will require a short downtime period to restart your cluster with the new version.

You need to ensure that your client applications and used SDKs are compatible with the target version. Keep your client SDK within one minor version of your cluster version. Larger gaps might work, but are not tested.

Update the cluster first, then update the client SDKs. This prevents your applications from using features that the older cluster version does not support yet. If you upgrade across several minor versions, for example from 1.15 to 1.19, update the client SDKs after the cluster reaches the target version.

## Upgrading to v1.20

As of v1.20.0, the internal gRPC API enforces authentication by default when an API key is configured. If your cluster sets only `read_only_api_key`, peers lose peer-to-peer communication after the upgrade. Set `api_key`, or set `enforce_internal_auth` to `false`. External tools that call the internal port must send the `api-key` header. For details, see [Enforce Authentication on Internal Communication](/documentation/security/#enforce-authentication-on-internal-communication).

## Qdrant Cloud

For Qdrant Cloud, see [Cluster Upgrades](/documentation/cloud/cluster-upgrades/).

## Kubernetes

If you are using Helm, you can upgrade your Qdrant cluster by upgrading the Helm release. For example:

```bash
helm upgrade qdrant qdrant/qdrant --version <target-version> -n <namespace>
```

Kubernetes will automatically perform a rolling update of the Qdrant StatefulSet.

## Docker

If you run Qdrant using Docker, you can upgrade to a new version by pulling the new image and restarting the Qdrant containers one after another. For example:

```bash
docker pull qdrant/qdrant
docker stop qdrant
docker run --name qdrant -d -p 6333:6333 \
    -v $(pwd)/path/to/data:/qdrant/storage \
    qdrant/qdrant
```

## Docker Compose

If you run Qdrant using Docker Compose, you can upgrade to a new version by updating the image version in your `docker-compose.yml` file and restarting the Qdrant service.
