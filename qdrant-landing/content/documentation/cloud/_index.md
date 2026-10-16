---
title: Managed Cloud
short_description: "Run Qdrant as a managed SaaS on AWS, GCP, or Azure with high availability, automatic scaling, backups, and zero-downtime upgrades."
description: "Run Qdrant as a managed service on AWS, GCP, or Azure with high availability, automatic scaling, backups, and zero-downtime version upgrades."
weight: 220
aliases:
  - /documentation/overview/qdrant-alternatives/documentation/cloud/
partition: deploy
---

# About Qdrant Managed Cloud

Qdrant Managed Cloud runs Qdrant clusters for you on AWS, GCP, or Azure. You use the same APIs and client libraries as with open source Qdrant. The only differences are the cluster URL and a [Database API key](/documentation/cloud/authentication/) on every request.

To create your first cluster, start with [Getting Started](/documentation/cloud-getting-started/).

## Choose a Deployment Model

| | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| Where clusters run | Qdrant-owned infrastructure on AWS, GCP, or Azure | Your Kubernetes clusters, in any environment | Your Kubernetes clusters, in any environment |
| Who operates the database | Qdrant | Qdrant Cloud, through an Operator in your cluster | You, with the Qdrant Operator |
| Management | Cloud Console, [Cloud API](/documentation/cloud-api/), [CLI](/documentation/cloud-cli/), and [Terraform](/documentation/cloud-tools/terraform/) | The same tools as Managed Cloud | Kubernetes resources, with no connection to Qdrant Cloud |
| Where your data lives | Qdrant-managed volumes, [encrypted at rest](/documentation/cloud-security/) | Inside your network | Inside your network |
| Read more | This section | [Hybrid Cloud](/documentation/hybrid-cloud/) | [Private Cloud](/documentation/private-cloud/) |

## Choose a Tier

| | Free | Standard | Premium |
|---|---|---|---|
| Use it for | Prototypes and tests | Production workloads | Production workloads with enterprise requirements |
| Cluster | 1 node, 1 GB RAM, 4 GB disk | Dedicated, multi-node, scalable | Dedicated, multi-node, scalable |
| Uptime SLA | Not included | 99.5% | 99.9%, or 99.95% for multi-AZ |
| Support | Standard support | Business hours | 24/7 for Severity 1 and 2 issues |

See [Create a Cluster](/documentation/cloud/create-cluster/) for the free tier limits and [Premium Tier](/documentation/cloud-premium/) for the full comparison. Billing is usage-based on CPU, memory, and disk. See [Billing & Payments](/documentation/cloud-pricing-payments/).

## What Each Cluster Includes

| Capability | What you get | Details |
|---|---|---|
| High availability | Automatic failover on clusters with 3 or more nodes and replicated collections | [Create a Cluster](/documentation/cloud/create-cluster/#creating-a-production-ready-cluster) |
| Scaling | Vertical and horizontal scaling, automatic shard rebalancing, and resharding | [Scale Clusters](/documentation/cloud/cluster-scaling/) |
| Upgrades | Rolling, zero-downtime upgrades when collections have a replication factor of 2 or more | [Update Clusters](/documentation/cloud/cluster-upgrades/) |
| Backups | Scheduled backups with retention, restored in place or into a new cluster | [Backup Clusters](/documentation/cloud/backups/) |
| Monitoring | Metrics, logs, email alerts, and a Prometheus-compatible endpoint with a Grafana dashboard | [Monitor Clusters](/documentation/cloud/cluster-monitoring/) |
| Access control | Database API keys with per-collection permissions, IP allowlists, and role-based access to the Console | [Authentication](/documentation/cloud/authentication/), [Cloud RBAC](/documentation/cloud-rbac/) |
| Audit logging | A record of API calls on paid clusters | [Configure Clusters](/documentation/cloud/configure-cluster/#audit-logging) |
| Inference | Embedding models hosted by Qdrant, or proxied to external providers | [Inference](/documentation/cloud/inference/) |
| Encryption | Storage volumes encrypted at rest, with customer-managed keys on Premium | [Encryption at Rest](/documentation/cloud/encryption/) |

## Cluster Lifecycle

1. [Create a cluster](/documentation/cloud/create-cluster/) and verify it against the [production checklist](/documentation/cloud/production-checklist/).
2. [Create a Database API key](/documentation/cloud/authentication/) and [connect](/documentation/cloud/cluster-access/).
3. [Configure the cluster](/documentation/cloud/configure-cluster/) for your workload.
4. [Scale](/documentation/cloud/cluster-scaling/), [monitor](/documentation/cloud/cluster-monitoring/), and [update](/documentation/cloud/cluster-upgrades/) it as it grows.
5. [Back it up](/documentation/cloud/backups/) on a schedule.
