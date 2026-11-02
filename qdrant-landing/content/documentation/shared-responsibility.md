---
title: Shared Responsibility
short_description: "Compare Managed Cloud, Hybrid Cloud, and Private Cloud: where the data plane runs, and who is responsible for infrastructure, upgrades, networking, access control, availability, and monitoring."
description: "Who is responsible for what in Qdrant Managed Cloud, Hybrid Cloud, and Private Cloud: infrastructure, Kubernetes, upgrades, networking, access control, backups, failover, monitoring, and logging."
weight: 232
partition: deploy
---

# Shared Responsibility by Deployment Model

Qdrant Cloud comes in three deployment models. They differ in where the data plane runs, how much infrastructure you own, and what Qdrant operates for you. The tables show who is responsible for each area. Each cell gives the short answer, and the notes and links give the detail.

## Deployment Models Compared

| | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Data plane** | Qdrant-operated cloud (AWS, GCP, Azure) | Your Kubernetes | Your Kubernetes |
| **Control plane** | Qdrant Cloud Console | Qdrant Cloud Console | Your own tooling |
| **Management UI** | Qdrant Cloud Console | Qdrant Cloud Console | None |
| **Kubernetes management** | Qdrant | You | You |
| **Qdrant components in your cluster** | Qdrant | Qdrant manages and updates them | You |
| **Cluster management** | You, in the Console | You, in the Console | You, in the Kubernetes API |
| **Access to your data by Qdrant** | Restricted and audited ([Trust Center](https://qdrant.to/trust-center)) | Telemetry and metadata only (see [Hybrid Cloud Architecture](/documentation/hybrid-cloud/#hybrid-cloud-architecture)) | None |
| **Telemetry shared with Qdrant** | Yes | Yes | No |
| **Integrated monitoring and alerting** | Yes | Yes | No |
| **Air-gapped operation** | No | No | Yes |

In all three models, the Qdrant Kubernetes Operator applies your cluster changes.

## Infrastructure

| Area | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Cloud accounts and infrastructure** | You pick the provider and region. Qdrant operates it | You | You |
| **Kubernetes provisioning** | Qdrant | You. Qdrant installs its components in your namespace. See [Setup](/documentation/hybrid-cloud/hybrid-cloud-setup/) | You |
| **Node OS and Kubernetes patching** | Qdrant | You | You |
| **Qdrant cluster management** | The Operator, from your Console settings | The Operator, from your Console settings, inside its namespace | The Operator, from the Kubernetes API |
| **Storage** | Qdrant | You provide storage classes | You provide storage classes |

## Upgrades

| Area | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Qdrant cluster upgrades** | You start them. See [Update Clusters](/documentation/cloud/cluster-upgrades/) | You start them | You start them |
| **Operator and Agent upgrades** | Qdrant | Qdrant, automatically. You cannot defer or roll back | You, manually |
| **Infrastructure vulnerability fixes** | Qdrant | You patch your cluster. Qdrant patches its components | You |
| **Client SDK upgrades** | You | You | You |

In all three models, you choose when to upgrade a Qdrant cluster, and the Operator runs it as a rolling upgrade. On a replicated cluster, there is no downtime.

## Networking

| Area | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Internal networking** | Qdrant. Premium adds [private connections](/documentation/cloud-premium/#private-network-connectivity) | You. The Operator sets the pod network policies | You. The Operator sets the pod network policies |
| **IP restrictions** | You set the ranges in the Console | You set them on your load balancer or ingress | You |
| **Firewall and ingress** | Qdrant | You. Allow outbound port 443 to `grpc.cloud.qdrant.io` and `api.cloud.qdrant.io`. Also allow `registry.cloud.qdrant.io` for images and Helm charts, unless you [mirror them](/documentation/hybrid-cloud/hybrid-cloud-setup/#mirroring-images-and-charts) | You |
| **DNS** | Qdrant provisions the endpoint | You | You |

## Access Control

| Area | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Console roles** | You, with [Cloud RBAC](/documentation/cloud-rbac/) | You, with Cloud RBAC | Not available |
| **Cluster API keys** | You, in the Console or API. See [Authentication](/documentation/cloud/authentication/) | You, in your own systems | You, in your own systems |
| **SSO** | You, on [Premium](/documentation/cloud-premium/#enterprise-single-sign-on-sso) | You, on Premium | Not provided |
| **Infrastructure IAM** | Qdrant | You | You |

## Availability

| Area | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Replication** | You set the factor | You set the factor and provide enough nodes | You set the factor |
| **Automated failover** | Qdrant | The Operator for the database. You for Kubernetes | The Operator for the database. You for Kubernetes |
| **Backups** | You schedule them. Qdrant stores them. See [Backups](/documentation/cloud/backups/) | You schedule them. They are stored in your account | You schedule and store them |
| **Disaster recovery** | You set the recovery goals and start restores | You, for Kubernetes and storage | You, for Kubernetes and storage |

## Monitoring and Logging

| Area | Managed Cloud | Hybrid Cloud | Private Cloud |
|---|---|---|---|
| **Infrastructure monitoring** | Qdrant | You monitor Kubernetes. Qdrant monitors its components | You |
| **Database metrics** | Qdrant collects them. You can also scrape them. See [Monitor Clusters](/documentation/cloud/cluster-monitoring/) | The Prometheus Agent collects them. You can also scrape them | You scrape `/metrics` |
| **Alerting** | Fixed email alerts. See [Cluster Alerts](/documentation/cloud/cluster-alerts/) | The same fixed email alerts | You build all alerting |
| **Audit logs** | You turn on [audit logging](/documentation/cloud/configure-cluster/#audit-logging) on paid clusters | You collect and keep the database logs | You collect and keep all logs |
| **Log forwarding to a SIEM** | You download the logs through the API | You | You |

## Notes on Hybrid Cloud

**Operator permissions.** The Operator stays inside the namespace that you chose, with least-privilege RBAC. To see its permissions, run `kubectl get role -n <your-qdrant-namespace>`. A Kubernetes [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/) on that namespace caps the CPU, memory, and storage that the Operator can allocate. The Operator does not scale your Kubernetes cluster.

**IP restrictions.** Qdrant is not in the traffic path to your clusters. Cluster creation offers the service type, the service annotations, and the load balancer source ranges, but your cloud provider and Kubernetes setup enforce them, and a setup can ignore the source ranges. See [Exposing Qdrant clusters](/documentation/hybrid-cloud/hybrid-cloud-cluster-creation/#exposing-qdrant-clusters-to-your-client-applications).

**Connectivity.** On AWS, Qdrant can set up a private link for the Agent traffic to the management plane. For the hosts to allow, see [Hybrid Cloud](/documentation/hybrid-cloud/).

## Further Reading

- [Cloud Security](/documentation/cloud-security/): encryption, access control, compliance certifications, and container image security
- [Managed Cloud](/documentation/cloud/): setup and cluster management
- [Hybrid Cloud](/documentation/hybrid-cloud/): architecture, setup, and operations
- [Private Cloud](/documentation/private-cloud/): setup and cluster management
