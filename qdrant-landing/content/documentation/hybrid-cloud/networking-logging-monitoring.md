---
title: Networking, Logging & Monitoring
weight: 4
---
# Configuring Networking, Logging & Monitoring in Qdrant Hybrid Cloud

## Configure network policies

For security reasons, each database cluster is secured with network policies. By default, database pods only allow egress traffic between each and allow ingress traffic to ports 6333 (rest) and 6334 (grpc) from within the Kubernetes cluster.

You can modify the default network policies in the Hybrid Cloud environment configuration:

```yaml
qdrant:
  networkPolicies:
    ingress:
    - from:
      - ipBlock:
          cidr: 192.168.0.0/22
      - podSelector:
          matchLabels:
            app: client-app
        namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: client-namespace
      - podSelector:
          matchLabels:
            app: traefik
        namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: kube-system
      ports:
      - port: 6333
        protocol: TCP
      - port: 6334
        protocol: TCP      
```

## Logging

You can access the logs with kubectl or the Kubernetes log management tool of your choice. For example:

```bash
kubectl -n qdrant-namespace logs -l app=qdrant,cluster-id=9a9f48c7-bb90-4fb2-816f-418a46a74b24
```

**Configuring log levels:** You can configure log levels for the databases individually in the configuration section of the Qdrant Cluster detail page. The log level for the **Qdrant Cloud Agent** and **Operator** can be set in the [Hybrid Cloud Environment configuration](/documentation/hybrid-cloud/operator-configuration/).

## Monitoring

The Qdrant Cloud console gives you access to basic metrics about CPU, memory and disk usage of your Qdrant clusters. You can also access Prometheus metrics endpoint of your Qdrant databases. Finally, you can use a Kubernetes workload monitoring tool of your choice to monitor your Qdrant clusters.
