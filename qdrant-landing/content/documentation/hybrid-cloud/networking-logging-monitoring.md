---
title: Networking, logging & monitoring
weight: 3
---

## Network policies

For security reasons, each database cluster is secured with tight network policies. By default, database pods only allow egress traffic between each and only allow ingress traffic from the operator for monitoring.

To allow additional ingress or egress traffic, you can either deploy additional network policies on your own.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: qdrant-9a9f48c7-bb90-4fb2-816f-418a46a74b24
  namespace: qdrant-namespace
spec:
  podSelector:
    matchLabels:
      app: qdrant
      cluster-id: 9a9f48c7-bb90-4fb2-816f-418a46a74b24
  policyTypes:
    - Ingress
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
      - protocol: TCP
        port: 6333
      - protocol: TCP
        port: 6334
```

Or you can modify the default network policies in the Hybrid Cloud environment configuration:

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

The Qdrant Cloud console gives you access to basic metrics about CPU, memory and disk usage of your Qdrant clusters. You can also access Prometheus metrics endpoint of yourQdrant databases. Finally, you can use a Kubernetes workload monitoring tool of your choice to monitor your Qdrant clusters.
