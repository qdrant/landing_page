---
title: Logging & Monitoring
weight: 4
---

# Configuring Logging & Monitoring in Qdrant Private Cloud

## Logging

You can access the logs with kubectl or the Kubernetes log management tool of your choice. For example:

```bash
kubectl -n qdrant-private-cloud logs -l app=qdrant,cluster-id=a7d8d973-0cc5-42de-8d7b-c29d14d24840
```

**Configuring log levels:** You can configure log levels for the databases individually through the QdrantCluster spec. Example:

```yaml
apiVersion: qdrant.io/v1
kind: QdrantCluster
metadata:
  name: qdrant-a7d8d973-0cc5-42de-8d7b-c29d14d24840
  labels:
    cluster-id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
    customer-id: "acme-industries"
spec:
  id: "a7d8d973-0cc5-42de-8d7b-c29d14d24840"
  version: "v1.11.3"
  size: 1
  resources:
    cpu: 100m
    memory: "1Gi"
    storage: "2Gi"
  config:
    log_level: "DEBUG"
```

## Monitoring

The Qdrant database, and the operator both expose a Prometheus compatible metrics endpoint at `/metrics`. That provides telemetry on the operator and your Qdrant databases.

