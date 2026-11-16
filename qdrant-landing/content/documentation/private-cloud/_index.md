---
title: Private Cloud
short_description: "Run Qdrant Private Cloud in your own Kubernetes cluster with full control over scheduling, security, and disaster recovery."
description: "Run Qdrant Private Cloud in any Kubernetes cluster with full control over scheduling, security, scaling, and disaster recovery, fully air-gapped."
weight: 265
partition: deploy
---

# Qdrant Private Cloud

Qdrant Private Cloud allows you to manage Qdrant database clusters in any Kubernetes cluster on any infrastructure. It uses the same Qdrant Operator that powers Qdrant Managed Cloud and Qdrant Hybrid Cloud, but without any connection to the Qdrant Cloud Management Console.

On top of the open source Qdrant database, it allows

* Easy deployment and management of Qdrant database clusters in your own Kubernetes infrastructure
* Zero-downtime upgrades of the Qdrant database with replication
* Vertical and horizontal up and downscaling of the Qdrant database with auto rebalancing and shard splitting
* Full control over scheduling, including Multi-AZ deployments
* Backup & Disaster Recovery
* Extended telemetry
* Qdrant Enterprise Support Services

Multi-AZ deployment is independent of replication factor: replicating your data doesn't by itself spread it across zones. See [Multi-AZ Deployments](/documentation/scaling/resilience/#multi-az-deployments) for the distinction.

## At a Glance

| Question | Answer |
|---|---|
| Where do the databases run? | In your Kubernetes cluster, on your own storage and compute. |
| Who creates and manages Qdrant clusters? | You, with Kubernetes resources such as `QdrantCluster`. The Operator in your Kubernetes cluster carries out the changes. There is no Console, CLI, or Cloud API. See [Managing a Cluster](/documentation/private-cloud/qdrant-cluster-management/). |
| What can Qdrant access? | Nothing. Private Cloud has no connection to Qdrant Cloud, shares no telemetry, and Qdrant has no access to your databases, data, API keys, backups, or logs. |
| What network access does it need? | None to Qdrant at runtime, apart from pulling images and Helm charts from `registry.cloud.qdrant.io`. If you [mirror them](/documentation/private-cloud/private-cloud-setup/#mirroring-images-and-charts) into your own registry, the cluster can run with no outbound connection to Qdrant at all. |
| What does it need from Kubernetes? | A standard compliant cluster, CSI block storage (with volume expansion for vertical scaling and snapshots for backups), and `cluster-admin` access for the installation. See [Requirements](/documentation/private-cloud/private-cloud-setup/#requirements). |
| How are the components updated? | You update them, with Helm. See [Upgrades](/documentation/private-cloud/private-cloud-setup/#upgrades). |
| How do I get access? | [Contact us](/contact-us/). After onboarding, you receive credentials for the Qdrant container registry. See [Getting Access](#getting-access). |

## What Runs Where

The installation puts the following components into your Kubernetes cluster:

| Component | Purpose |
|---|---|
| Custom Resource Definitions (CRDs) | Define the Qdrant resources, such as `QdrantCluster`, `QdrantClusterSnapshot`, and `QdrantClusterRestore`. See the [API Reference](/documentation/private-cloud/api-reference/). |
| Qdrant Operator | Watches the Qdrant resources and creates and manages the Pods, Services, ConfigMaps, and Secrets that run each database cluster. |
| Cluster manager | Moves shards between nodes, for example when you scale or rebalance a cluster. |
| Cluster exporter | Exposes metrics about your Qdrant clusters in Prometheus format. |

The Qdrant database clusters that you create run as Pods next to these components. Unlike in Hybrid Cloud, there is no Cloud Agent and no Prometheus Agent, because nothing reports to Qdrant.

## Responsibilities

Since there is no communication or connection with Qdrant, you are fully responsible for the entire security of the Qdrant Private Cloud installation. This also means that you do not benefit from all the integrated management and observability features of Qdrant Managed Cloud and Hybrid Cloud, such as:

* A central management UI and API
* Integrated monitoring and alerting
* Configuration recommendations

You run your own monitoring and alerting instead. See [Logging & Monitoring](/documentation/private-cloud/logging-monitoring/). [Shared Responsibility](/documentation/shared-responsibility/) compares what you and Qdrant each own in all three deployment models. We encourage you to weigh your security requirements against Hybrid Cloud before inquiring about Private Cloud.

## Getting Access

To get access to Qdrant Private Cloud, please [contact us](/contact-us/). After onboarding, you receive credentials for the Qdrant container registry, which you use to [install](/documentation/private-cloud/private-cloud-setup/#installation) the Operator.
