---
title: Overview
short_description: "Qdrant Managed Cloud runs Qdrant for you as Dedicated Clusters or as Serverless spaces. Compare the two and find where to start with each."
description: "Overview of Qdrant Managed Cloud: Dedicated Clusters on AWS, GCP, or Azure, and Serverless spaces that scale with demand. Compare the two options, with links to getting started, connecting, securing, and backing up each."
weight: 261
partition: deploy
---

# Qdrant Managed Cloud

With Qdrant Managed Cloud, Qdrant hosts and operates Qdrant for you. You manage it from the Cloud Console, the [Cloud API](/documentation/cloud-automation/cloud-api/), the [`qcloud` CLI](/documentation/cloud-automation/cloud-cli/), or [Terraform](/documentation/cloud-automation/terraform/). Managed Cloud offers two options:

- **[Dedicated Clusters](/documentation/cloud/)** run on AWS, GCP, or Azure. You size, configure, and scale them, and you use the same [APIs and client libraries](/documentation/interfaces/) as with open source Qdrant. You can start with a free cluster and move to a paid one for production.
- **[Serverless](/documentation/serverless/)** spaces have no nodes to provision, no capacity to plan, and no index parameters to tune. You choose a region and a precision tier for each vector, and the platform scales with demand. You pay for what you use.

## Dedicated Clusters or Serverless

Serverless fits workloads whose data size or traffic is hard to predict, such as large multi-tenant applications, low or bursty search traffic, and data volumes that change all the time. See [When to Use Serverless](/documentation/serverless/#when-to-use-serverless).

Dedicated clusters fit larger single-tenant workloads, especially where low latency is critical. They're also the choice when you need a specific cloud provider, fine control over index and quantization settings, or features that Serverless doesn't support. See [Limitations and Differences](/documentation/serverless/#limitations-and-differences).

| Capability | Dedicated Clusters | Serverless |
|---|---|---|
| Sizing and scaling | You choose CPU, RAM, and node count | Handled by the platform |
| Cloud provider | You choose AWS, GCP, or Azure | Handled by the platform. You choose only the region. |
| Qdrant version | You choose it and schedule upgrades | Handled by the platform |
| Index and quantization tuning | Full control over HNSW, quantization, and storage | One precision tier per vector |
| Collection changes after creation | Supported | Not supported |
| Client | `QdrantClient` | `QdrantServerless` |
| Update visibility | Immediate once the write is applied | Delayed until search workers reload |
| Update operations | Full, including update and delete by filter | Upserts and deletes by point ID |
| Backups | Snapshots and managed backups | Managed backups, per space or per collection |
| Network access | IP allowlists. Private links on Premium. | IP and CORS allowlists. No private links. |
| Cost controls | Cost follows the resources you choose | Storage and monthly spend limits per space |
| Audit logs | Supported on paid clusters | Not supported |
| Dense, sparse, named, and multivectors | Supported | Supported |
| Hybrid search | Supported | Supported |
| [Cloud Inference](/documentation/cloud/inference/) | Supported | Supported |
| Distance metrics | Cosine, Dot, Euclid, Manhattan | Cosine, Dot, Euclid, Manhattan |

## Dedicated Clusters

- [Getting Started](/documentation/cloud/getting-started/): prepare access, size your cluster, deploy, and prepare a workload for production.
- [Create a Cluster](/documentation/cloud/create-cluster/): launch a free or standard cluster, with options for high availability and GPUs.
- [Connect to a Cluster](/documentation/cloud/cluster-access/): find the cluster endpoint, choose REST or gRPC, and restrict access with IP allowlists.
- [Authentication](/documentation/cloud/authentication/): create Database API keys with per-collection permissions, and rotate or revoke them.
- [Backup Clusters](/documentation/cloud/backups/): schedule backups and restore them in place, into a new cluster, or per collection.

For everything else a cluster includes, such as scaling, monitoring, and upgrades, see [Dedicated Clusters](/documentation/cloud/).

## Serverless

- [Serverless Quickstart](/documentation/serverless/quickstart/): create a space, index a sample menu, and run a hybrid search.
- [Manage Spaces](/documentation/serverless/spaces/): create a space, and set storage and spend limits.
- [Connect to a Space](/documentation/serverless/connect/): install the `QdrantServerless` client and connect with an API key.
- [Manage Collections](/documentation/serverless/collections/): create collections with precision tiers and payload indexes.
- [Secure a Space](/documentation/serverless/security/): create scoped API keys, and restrict access by IP range and origin.
- [Back Up and Restore](/documentation/serverless/backups/): schedule backups and restore them in place or into a new space.

For concepts, monitoring, and limits, see [About Qdrant Serverless](/documentation/serverless/).
