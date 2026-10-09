---
title: Premium Tier
short_description: "Qdrant Cloud Premium adds a 99.9% uptime SLA (99.95% multi-AZ), 24/7 support, SSO, private networking, and customer-managed encryption keys."
description: "Compare Qdrant Cloud Premium with Standard: uptime SLA, support response times by severity, multi-AZ clusters, SSO, private links, encryption keys, and how to upgrade."
weight: 260
partition: deploy
aliases:
  - /documentation/cloud/premium/
---

# Qdrant Cloud Premium Tier

Premium is an optional tier of Qdrant Managed Cloud for production workloads that need a higher uptime commitment, faster support around the clock, and enterprise security controls. It's a committed-usage plan with a minimum spend.

Premium includes everything in the Standard tier, such as vertical and horizontal scaling, high-availability setups, backups, and monitoring. For every feature by tier, see the [Qdrant Cloud feature comparison](/pricing/comparison/).

## Standard and Premium Compared

The following table lists what changes when you move from Standard to Premium. The [Qdrant Cloud SLA](https://qdrant.to/sla/) is the binding source for every uptime and response-time figure on this page.

| Feature | Standard | Premium |
|---|---|---|
| [Uptime SLA](#uptime-sla) | 99.5% | 99.9%, or 99.95% for multi-AZ clusters |
| [Support hours](#support) | Business hours | 24/7 for Severity 1 and 2 issues |
| Severity 1 initial response | 4 business hours | 1 hour |
| Support channels | Support portal and email | Support portal, email, and an optional private Slack or Discord channel |
| Migration support | Not included | Dedicated engineering support |
| [Multi-AZ clusters](#multi-az-clusters) | Not included | Included |
| [Enterprise SSO](#enterprise-single-sign-on-sso) | Not included | Included |
| [Private network connectivity](#private-network-connectivity) | Not included | AWS PrivateLink and GCP Private Service Connect |
| [Customer-managed encryption keys](#customer-managed-encryption-keys) | Not included | AWS KMS, GCP Cloud KMS, and Azure Key Vault |
| Pricing | Pay as you go, or a committed-spend contract | Committed-spend contract with a minimum spend |

## Uptime SLA

Premium commits to 99.9% quarterly uptime for clusters in a single availability zone and 99.95% for [multi-AZ clusters](#multi-az-clusters). Standard commits to 99.5%. Uptime is measured per cluster over each calendar quarter.

Downtime is a period of at least 5 consecutive minutes in which 100% of requests to the cluster's database API can't reach it, as measured by Qdrant's monitoring. The following don't count as downtime:

- Elevated latency, a partial node failure, or a Cloud Console issue on its own
- Scheduled maintenance announced at least 5 working days ahead, up to 4 hours per quarter
- Emergency security maintenance announced 24 hours ahead, up to 1 hour each time
- Any period in which the cluster runs a Qdrant version older than the current minor version and the 3 before it

The SLA covers clusters on Qdrant Managed Cloud only. It doesn't apply to [Hybrid Cloud](/documentation/hybrid-cloud/) or [Private Cloud](/documentation/private-cloud/) clusters, which run on your own infrastructure. For the full list of exclusions, see the [Qdrant Cloud SLA](https://qdrant.to/sla/).

If a cluster misses its uptime commitment, you can claim service credits against future invoices. Open a support ticket within 5 working days of the incident and include the details listed in the [Support](/documentation/support/) guide. The SLA sets the credit percentage for each uptime band.

<aside role="status">To keep a cluster available through node restarts, upgrades, and failures, run at least 3 nodes with a replication factor of 2 or more. See <a href="/documentation/scaling/resilience/#setting-up-a-resilient-qdrant-cluster">Setting Up a Resilient Qdrant Cluster</a>.</aside>

## Support

Premium support is available 24/7. Response-time commitments for Severity 1 and 2 issues run around the clock. Severity 3 and 4 commitments count business hours only: Monday to Friday, 08:00 to 18:00 CET, excluding public holidays in Germany. Standard support follows business hours for every severity.

The following table shows the initial response time for each severity level:

| Severity | Impact | Standard | Premium |
|---|---|---|---|
| 1 | The database service can't operate for all or most of your users: it won't start or authenticate, or it can't query or write data. | 4 business hours | 1 hour |
| 2 | Important functionality in the database service or the Cloud Console doesn't work, or some of your users can't use the service. | 6 business hours | 2 hours |
| 3 | Some functionality is impaired, but you can keep working. | 24 business hours | 4 business hours |
| 4 | General usage questions, cosmetic issues, documentation errors, and cases opened by email. | 24 business hours | 24 business hours |

Premium customers reach support through the [Qdrant support portal](https://support.qdrant.io/), by email at support@qdrant.io, and optionally through a private Slack or Discord channel shared with the Qdrant team. Report Severity 1 and 2 issues through the support portal. The private channel doesn't count as a support channel for those issues, and the SLA classifies cases opened by email as Severity 4.

Premium also includes dedicated engineering support while you migrate workloads to Qdrant Cloud.

For how to file a ticket and what information to include, see [Support](/documentation/support/).

## Multi-AZ Clusters

A multi-AZ cluster spreads its nodes across several availability zones in one region, so the cluster stays available if a zone goes down. Qdrant places each shard's replicas in different zones and routes traffic between zones automatically.

Replication alone doesn't give you this protection. On a single-zone cluster, every replica of a shard can sit in the same zone, so one zone outage can take all of them down. For more detail, see [Multi-AZ Deployments](/documentation/scaling/resilience/#multi-az-deployments).

To run a multi-AZ cluster:

1. Check **Multi AZ Deployment** when you [create the cluster](/documentation/cloud/create-cluster/#creating-a-production-ready-cluster). You can't turn it on or off after the cluster exists.
2. Run at least 3 nodes. Multi-AZ clusters scale in multiples of 3 (3, 6, 9, and so on), so each zone gets the same number of nodes.
3. Set a replication factor of at least 2 on every collection. A replication factor of 3 is recommended.
4. Keep `write_consistency_factor` and the read `consistency` parameter low enough that the replicas left after a zone outage can satisfy them. The default of 1 for both does. See [Consistency Guarantees](/documentation/scaling/consistency-guarantees/).

The 99.95% uptime commitment doesn't cover outages caused by replication or consistency settings that can't tolerate the loss of one zone.

## Enterprise Single Sign-On (SSO)

With SSO, your team signs in to the Qdrant Cloud Console through your identity provider. Qdrant Cloud supports the following providers:

- Active Directory/LDAP
- ADFS
- Azure Active Directory
- Azure Active Directory Native
- Google Workspace
- Okta
- OpenID Connect
- PingFederate
- SAML

To turn on SSO for your account, open a ticket in the [Qdrant support portal](https://support.qdrant.io/). To control what each user can do after they sign in, use [Cloud RBAC](/documentation/cloud-rbac/). For a video walkthrough, see [Enterprise Single-Sign-On](/documentation/cloud-account-setup/#enterprise-single-sign-on-sso).

## Private Network Connectivity

Premium clusters on AWS and GCP can accept traffic from your own VPC over AWS PrivateLink or GCP Private Service Connect. Traffic between your application and the cluster then stays on the cloud provider's network instead of crossing the public internet.

Private connections are set up per cluster through a support ticket. Every new cluster needs its own connection, so request it as soon as you create the cluster and wait for confirmation before you route production traffic to it.

Private connections to [multi-AZ clusters](#multi-az-clusters) are available in selected regions only. If you need both, confirm with Qdrant Support that your region supports them before you create the cluster. If you're replacing a cluster, see [Private Link or Private Service Connect on Qdrant Cloud](/documentation/tutorials-operations/blue-green-deployment/#private-link-or-private-service-connect-on-qdrant-cloud) in the blue-green deployment guide.

## Customer-Managed Encryption Keys

Qdrant Cloud encrypts every storage volume at rest by default. Premium customers can encrypt their cluster's volumes with a key they own in their cloud provider's key management service (KMS): AWS KMS, GCP Cloud KMS, or Azure Key Vault. The key must be in the same region as the cluster.

Setup runs through a support ticket, and Qdrant recommends enabling it on an empty cluster. For the steps on each cloud provider, see [Encryption at Rest](/documentation/cloud/encryption/).

## Upgrade to Premium

Premium is a committed-usage plan with a minimum spend that you agree with Qdrant. To discuss your requirements, [contact the Qdrant team](/contact-us/).

Premium applies to a whole Qdrant Cloud account, not to individual clusters, so every cluster in a Premium account runs on the Premium tier. To keep development or staging clusters on the Standard tier, run them in a separate account. One contract can cover both accounts.

After your account moves to Premium, you enable SSO, private connections, and customer-managed encryption keys through support tickets. Multi-AZ can only be chosen when you create a cluster, so to move an existing workload to multi-AZ, create a new multi-AZ cluster and migrate to it, for example with a [blue-green deployment](/documentation/tutorials-operations/blue-green-deployment/).
