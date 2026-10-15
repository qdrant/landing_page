---
title: Getting Started
short_description: "Get started with Qdrant Managed Cloud: prepare access, size your cluster, deploy, and prepare a workload for production."
description: "Onboarding guide for Qdrant Managed Cloud: choose a cluster type, size it, create it, connect with an API key, and apply the minimum production settings."
weight: 205
partition: deploy
aliases:
  - /documentation/cloud/getting-started/
---

# Getting Started with Qdrant Managed Cloud

This page takes you from no account to a connected, production-ready cluster. Each section gives the values you need and links to the page that covers the topic in full.

## Before You Start

| You need | Details |
|---|---|
| A Cloud account | Sign up with email, Google, or GitHub at [cloud.qdrant.io](https://cloud.qdrant.io/signup). Each user can own up to 5 accounts. See [Account Setup](/documentation/cloud-account-setup/). |
| Billing details | Free clusters need no credit card. Standard clusters need a credit card or an AWS, GCP, or Azure Marketplace subscription, set up on the Billing Details screen. If you have a custom payment agreement, create your account first, then [contact support](https://support.qdrant.io/). See [Billing & Payments](/documentation/cloud-pricing-payments/). |
| A role that can create clusters | The Owner and Admin roles can. For custom roles, see [Cloud RBAC](/documentation/cloud-rbac/). |

## Choose a Cluster Type

| | Free | Standard | Premium |
|---|---|---|---|
| Resources | 1 node with 0.5 vCPU, 1 GB RAM, and 4 GB disk, shared | Dedicated, sized by you | Dedicated, sized by you |
| Nodes | 1 | 1 or more | 1 or more |
| Providers and regions | Limited choice | AWS, GCP, and Azure, broad choice | AWS, GCP, and Azure, broad choice |
| Upgrades | With downtime | Zero downtime on multi-node clusters with replication | Zero downtime on multi-node clusters with replication |
| Backups | Manual snapshots through the API | Scheduled backups and restores | Scheduled backups and restores |
| Uptime SLA | Not included | 99.5% | 99.9%, or 99.95% for multi-AZ |
| Also includes | Basic monitoring, logs, and alerting | Scaling, audit logging, and GPUs for indexing (AWS only) | SSO, private networking, customer-managed keys, and 24/7 support |

Free clusters are suspended after 1 week without use and deleted after 4 weeks of inactivity. You can upgrade a free cluster to a standard cluster at any time. For the full comparison, see [Create a Cluster](/documentation/cloud/create-cluster/) and [Premium Tier](/documentation/cloud-premium/).

## Size Your Cluster

Estimate the RAM and disk for each collection, then sum them. For dense vectors, the base requirement is:

```text
dense_size = points * replication_factor * dimensions * bytes_per_dim
```

`bytes_per_dim` is 4 for `float32` (the default), 2 for `float16`, 1 for `uint8`, and 0.5 for `turbo4`. For example, one million 768-dimension `float32` points with a replication factor of 2 need about 5.7 GB. Add the HNSW index, payloads, payload indexes, and quantized copies on top of that.

- **Start with the estimate, not the maximum.** You can scale RAM and CPU up or down later. If your collections are not replicated, vertical scaling restarts every node and causes a short downtime.
- **Disk only grows.** You can add disk space but not remove it, so add it in steps.
- **Trade RAM for disk when cost matters.** [Quantization](/documentation/manage-data/quantization/) and the `cold` [memory tier](/documentation/manage-data/storage/#configuring-memmap-storage) reduce memory use. Plan more disk per GB of RAM when you use them.

The full formulas for sparse vectors, payloads, and indexes are in [Capacity Planning](/documentation/capacity-planning/). To get a cost estimate, use the [Pricing Calculator](https://cloud.qdrant.io/calculator) or the [Sizing Calculator](https://sizing.qdrant.tech/estimate).

## Create a Cluster

1. In the [Cloud Console](https://cloud.qdrant.io/), open **Clusters** and select **+ Create**.
2. Select **Free** or **Standard**.
3. Select a cloud provider and region. Pick the region closest to your application.
4. Set RAM, vCPU, and the number of nodes. Choose at least 3 nodes for production.
5. Add disk space, and on AWS choose a disk speed tier.
6. Review the configuration and price, then select **Create**.

Provisioning takes some time. After that, the cluster serves REST on ports `443` and `6333`, and gRPC on port `6334`. All options, including GPUs, Multi-AZ, and Hybrid Cloud environments, are described in [Create a Cluster](/documentation/cloud/create-cluster/).

## Create an API Key and Connect

Every request to a cluster needs a Database API key.

1. Open the cluster and go to **API Keys**.
2. Select **Create**, and enter a name.
3. Set an expiration. The default is 90 days. An empty value means the key never expires.
4. Keep the default **manage/write** permission, or choose read-only. To restrict the key to specific collections, use the **Collections** tab.
5. Select **Create** and copy the key. It is shown only once.

Your cluster endpoint has the form `https://<cluster-id>.<region>.<provider>.cloud.qdrant.io`. Requests to it are load balanced across all healthy nodes. Pass the key in the `api-key` header, or use the official clients:

{{< code-snippet path="/documentation/headless/snippets/authentication/api-key/" >}}

A successful request returns the server title, version, and commit. Granular access control for keys requires cluster version v1.11.0 or later. See [Authentication](/documentation/cloud/authentication/).

<aside role="alert">
    A Database API key keeps working after the user who created it is removed from the account. Revoke a user's keys when you remove them.
</aside>

## Load Data and Search

- **Create a collection, upload points, and run a query** with the [Cloud Quickstart](/documentation/cloud-quickstart/).
- **Generate embeddings inside the cluster** with [Cloud Inference](/documentation/cloud/inference/). It is enabled by default on clusters created after July 7, 2025, and includes free dense, sparse, and multivector models.
- **Bring data from another system** with the [migration guides](/documentation/migrate-to-qdrant/).

## Prepare for Production

A cluster is production-ready when it meets these minimums:

| Area | Minimum | Where to set it |
|---|---|---|
| Availability | At least 3 nodes, and a replication factor of at least 2 on every collection | **High Availability** option at cluster creation, and the default replication factor under **Collection Defaults** |
| Scaling headroom | At least 2 shards per node in each collection | Shard count at collection creation. [Resharding](/documentation/cloud/cluster-scaling/#resharding) changes it later |
| Recovery | A backup schedule | **Backups** tab of the cluster. See [Backups](/documentation/cloud/backups/) |
| Access | One key per application with an expiration, and the narrowest permission each needs | **API Keys** tab. Restrict client networks with [IP ranges](/documentation/cloud/configure-cluster/#client-ip-restrictions) |
| Disk speed (AWS) | **Balanced** tier for disks of 32 GiB or more, **Performance** tier for 256 GiB or more | Cluster creation |
| Monitoring | Alert emails reaching the account owner, and metrics scraped from `/metrics` and `/sys_metrics` | See [Monitoring](/documentation/cloud/cluster-monitoring/) |
| Upgrades | Update client SDKs first, take a backup, then update the cluster | See [Updating Clusters](/documentation/cloud/cluster-upgrades/) |

Multi-AZ clusters, available on the Premium tier, can only be chosen at creation. They need a multiple of 3 nodes. For the reasoning behind each setting, see [Vector Search in Production](/documentation/production-operations/vector-search-in-production/).

## Automate

| Tool | Use it for | Start here |
|---|---|---|
| Cloud API | Provisioning from services and scripts, at `https://api.cloud.qdrant.io` (REST) or `grpc.cloud.qdrant.io:443` (gRPC), with a Cloud Management Key | [Cloud API](/documentation/cloud-api/) |
| `qcloud` CLI | Terminal and CI workflows | [Cloud CLI](/documentation/cloud-cli/) |
| Terraform and Pulumi | Version-controlled infrastructure | [Infrastructure Tools](/documentation/cloud-tools/) |

## Next Steps

| To do this | Read |
|---|---|
| Invite teammates and set roles | [Cloud RBAC](/documentation/cloud-rbac/) |
| Change cluster size | [Scale Clusters](/documentation/cloud/cluster-scaling/) |
| Tune defaults and restart behavior | [Configure Clusters](/documentation/cloud/configure-cluster/) |
| Review compliance and network isolation | [Cloud Security](/documentation/cloud-security/) |
| Compare Standard and Premium | [Premium Tier](/documentation/cloud-premium/) |
