---
title: Changelog
type: marketing/changelog
cascade:
  type: marketing/changelog
short_description: "Release notes for the Qdrant vector search and Qdrant Cloud, newest first."
description: "Release history for the Qdrant vector search and Qdrant Cloud: new features, performance improvements, and fixes, newest first."
keywords: qdrant changelog, qdrant release notes, qdrant cloud changelog, private cloud changelog, vector search releases
build:
  render: always
hero:
  label: Changelog
  title: What's New in Qdrant
  description: "Every release of the Qdrant Vector Search and Qdrant Cloud in one place. Filter by product to see what matters to your deployment."
# Each entry needs a product (qdrant, cloud, or private-cloud), a version, and a date.
# edition is an optional label shown next to the product name.
# Versions ending in .0 are shown as feature releases, the rest as patches.
# Order does not matter, entries are sorted by date.
entries:
  - product: qdrant
    version: v1.20.2
    date: 2026-11-16
    highlights:
      - "Significantly faster batch searches that apply the same filter to the same vector"
      - "HNSW graphs are built with the classic algorithm by default again, so `ef_construct` tunes graph quality on large segments"
      - "Fix a new peer failing to join the cluster right after a leader election"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.20.2
  - product: qdrant
    version: v1.20.1
    date: 2026-11-13
    highlights:
      - "Much faster filters with several conditions on cold on-disk payload indexes"
      - "Half as many reads in HNSW graph search on cold on-disk storage"
      - "Fix HNSW index builds being up to 3x slower on hosts with many cores, a regression in v1.20.0"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.20.1
  - product: qdrant
    version: v1.20.0
    date: 2026-10-22
    summary: "BM25 scoring on full-text indexes, a code tokenizer, and faster nested filters."
    highlights:
      - "[BM25 scoring](/documentation/manage-data/indexing/#bm25-scoring) on full-text indexes"
      - "Better code search with the [`code` tokenizer](/documentation/manage-data/indexing/#code)"
      - "Faster nested filters with [per-element indexes](/documentation/manage-data/indexing/#per-element-index-for-arrays-of-objects)"
      - "16-bit and 8-bit TurboQuant datatypes: [`turbo16`](/documentation/manage-data/vectors/#turbo16) and [`turbo8`](/documentation/manage-data/vectors/#turbo8)"
      - "[Memory tiers](/documentation/ops-configuration/memory-tiers/) for more components, including the ID tracker"
    blog: /blog/qdrant-1.20.x/
    url: https://github.com/qdrant/qdrant/releases/tag/v1.20.0
  - product: qdrant
    version: v1.19.2
    date: 2026-10-05
    highlights:
      - "Significantly faster sparse vector upserts"
      - "Fix storage corruption from torn writes in Gridstore"
      - "Raft snapshots no longer block access to all collections"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.19.2
  - product: qdrant
    version: v1.19.1
    date: 2026-09-04
    highlights:
      - "Faster quantized scoring with prefetching and a reworked 4-bit TurboQuant SIMD implementation"
      - "1.5x faster shard transfers for payload-heavy collections"
      - "Fix a data consistency issue when building payload indexes"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.19.1
  - product: qdrant
    version: v1.19.0
    date: 2026-08-05
    summary: "The TurboQuant datatype, memory tiers, and per-tenant IDF statistics."
    highlights:
      - "The [`turbo4` datatype](/documentation/manage-data/vectors/#turbo4) stores vectors with 4-bit TurboQuant compression only"
      - "[Memory tiers](/documentation/ops-configuration/memory-tiers/): one `memory` parameter sets `pinned`, `cached`, or `cold` per component"
      - "[Per-tenant IDF statistics](/documentation/manage-data/multitenancy/#per-tenant-idf-statistics) for sparse vector search"
      - "[Prefix match](/documentation/search/filtering/#prefix-match) and [slice](/documentation/search/filtering/#slice) filter conditions"
      - "[Web UI](/documentation/web-ui/) enhancements, including resharding progress"
    blog: /blog/qdrant-1.19.x/
    url: https://github.com/qdrant/qdrant/releases/tag/v1.19.0
  - product: qdrant
    version: v1.18.3
    date: 2026-07-17
    highlights:
      - "Fix query errors when using shard keys during resharding"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.18.3
  - product: qdrant
    version: v1.18.2
    date: 2026-06-04
    highlights:
      - "Security fixes for REST auth path handling and malicious snapshots"
      - "Payload indexes are no longer rebuilt when only the `on_disk` flag changes"
      - "Fix a potential optimizer loop with multivectors and `prevent_unoptimized`"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.18.2
  - product: qdrant
    version: v1.18.1
    date: 2026-05-22
    highlights:
      - "Authorize requests before accepting snapshot uploads"
      - "Validate vector dimensions before the WAL write for async upserts"
      - "Fixes for resharding, snapshot transfers, and filtering edge cases"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.18.1
  - product: qdrant
    version: v1.18.0
    date: 2026-05-11
    summary: "TurboQuant quantization, memory monitoring, and named vector management."
    highlights:
      - "[TurboQuant](/documentation/manage-data/quantization/) quantization"
      - "[Memory monitoring](/documentation/ops-monitoring/memory-usage/) with a per-component breakdown"
      - "[Add and remove named vectors](/documentation/manage-data/collections/#update-vector-schema) without recreating the collection"
      - "[Audit logging](/documentation/security/#audit-logging) improvements: a query API and request tracing IDs"
      - "[Per-collection API metrics](/documentation/ops-monitoring/monitoring/#per-collection-api-metrics)"
    blog: /blog/qdrant-1.18.x/
    url: https://github.com/qdrant/qdrant/releases/tag/v1.18.0
  - product: qdrant
    version: v1.17.1
    date: 2026-03-27
    highlights:
      - "Deferred point updates with `prevent_unoptimized=true`"
      - "Non-blocking Gridstore flushes for lower search tail latency"
      - "Security fix: snapshots are recovered only from the snapshot directory"
    url: https://github.com/qdrant/qdrant/releases/tag/v1.17.1
  - product: qdrant
    version: v1.17.0
    date: 2026-02-20
    summary: "Relevance feedback queries, lower search latency, and better operational observability."
    highlights:
      - "[Relevance Feedback Query](/documentation/search/search-relevance/#relevance-feedback)"
      - "[Lower search latency](/documentation/search/low-latency-search/) under write load and with delayed fan-outs"
      - "[Cluster-wide telemetry](/documentation/ops-monitoring/monitoring/#cluster-wide-telemetry) and [optimization monitoring](/documentation/ops-optimization/optimizer/#optimization-monitoring)"
      - "Redesigned point search in the [Web UI](/documentation/web-ui/)"
    blog: /blog/qdrant-1.17.x/
    url: https://github.com/qdrant/qdrant/releases/tag/v1.17.0

  - product: private-cloud
    version: 1.15.0
    date: 2026-11-05
    highlights:
      - "Fix global quotas being re-enabled after you disable or change them through the Qdrant quotas API"
      - "Default 90% quotas are now set in the Qdrant configuration, so quotas set through the API take precedence"
    url: /documentation/private-cloud/changelog/#1150-2026-11-05
  - product: private-cloud
    version: 1.14.0
    date: 2026-11-03
    highlights:
      - "Fix Pods in the `Failed` phase not being deleted automatically"
    url: /documentation/private-cloud/changelog/#1140-2026-11-03
  - product: private-cloud
    version: 1.13.0
    date: 2026-10-23
    highlights:
      - "Support for Qdrant 1.20, with `io_uring` enabled automatically where available"
      - "[Scale down disk space](/documentation/private-cloud/qdrant-cluster-management/#scaling-down-disk-space) by reducing `spec.resources.storage`"
      - "Configurable [audit log output](/documentation/private-cloud/qdrant-cluster-management/#audit-logging)"
    url: /documentation/private-cloud/changelog/#1130-2026-10-23
  - product: private-cloud
    version: 1.12.0
    date: 2026-10-21
    highlights:
      - "Updated qdrant-cluster-manager and qdrant-cluster-exporter"
    url: /documentation/private-cloud/changelog/#1120-2026-10-21
  - product: private-cloud
    version: 1.11.0
    date: 2026-10-16
    highlights:
      - "Updated operator"
    url: /documentation/private-cloud/changelog/#1110-2026-10-16
  - product: private-cloud
    version: 1.10.0
    date: 2026-10-06
    highlights:
      - "Global quota enforcement for Qdrant 1.20 and newer"
      - "Configurable Kubernetes cluster domain"
      - "Data volumes are kept for a configurable TTL after a cluster is deleted"
    url: /documentation/private-cloud/changelog/#1100-2026-10-06
  - product: private-cloud
    version: 1.9.15
    date: 2026-09-04
    highlights:
      - "Fix an edge case where a stuck init container could block a Qdrant upgrade"
    url: /documentation/private-cloud/changelog/#1915-2026-09-04
  - product: private-cloud
    version: 1.9.14
    date: 2026-08-21
    highlights:
      - "Faster cluster manager for clusters with many nodes"
      - "Support for `rebalanceStrategy: disabled`"
    url: /documentation/private-cloud/changelog/#1914-2026-08-21
  - product: private-cloud
    version: 1.9.12
    date: 2026-07-17
    highlights:
      - "Operator RBAC tightened to least privilege"
      - "Ingress and routing permissions are now feature-gated"
    url: /documentation/private-cloud/changelog/#1912-2026-07-17
  - product: private-cloud
    version: 1.9.10
    date: 2026-06-25
    highlights:
      - "Configurable `LoadBalancerSourceRanges` for load balancer services"
    url: /documentation/private-cloud/changelog/#1910-2026-06-25
  - product: private-cloud
    version: 1.9.7
    date: 2026-05-28
    highlights:
      - "Support for Qdrant 1.18"
      - "Configure Qdrant [audit logging](/documentation/private-cloud/qdrant-cluster-management/#audit-logging) through `spec.config.audit`"
    url: /documentation/private-cloud/changelog/#197-2026-05-28
  - product: private-cloud
    version: 1.9.6
    date: 2026-02-19
    highlights:
      - "Support for Qdrant 1.17"
    url: /documentation/private-cloud/changelog/#196-2026-02-19
  - product: private-cloud
    version: 1.9.5
    date: 2026-02-18
    highlights:
      - "Support for VolumeAttributesClasses on storage volumes"
      - "Metrics exposed on a separate port for finer NetworkPolicy control"
      - "Extended status information, including the Qdrant Pod zone"
    url: /documentation/private-cloud/changelog/#195-2026-02-18
  - product: private-cloud
    version: 1.9.4
    date: 2026-01-15
    highlights:
      - "Configurable labels for qdrant-cluster-manager"
      - "qdrant-cluster-exporter RBAC limited to the release namespace"
    url: /documentation/private-cloud/changelog/#194-2026-01-15

  - product: cloud
    version: "New AWS Seoul Region"
    kind: release
    date: 2026-11-17
    description: "A new AWS Seoul region is available using ap-northeast-2."
  - product: cloud
    version: "Redesigned Backups Page"
    kind: release
    date: 2026-11-10
    description: "The Backups page has a new design. You can now name backups and schedules, back up as often as every 30 minutes, and see pricing more clearly."
  - product: cloud
    version: "Multi-Factor Authentication (MFA)"
    kind: release
    date: 2026-11-10
    description: "You can now protect your Qdrant Cloud login with an authenticator app. Turn on MFA under Security in your user profile, and you enter a one-time code at every sign-in."
  - product: cloud
    version: "Customer-Managed Encryption Keys on Azure"
    kind: release
    date: 2026-11-09
    description: "Premium clusters on Azure can now encrypt their storage with a key you own in Azure Key Vault. Qdrant Support configures the cluster once your key is in place."
  - product: cloud
    version: "Invoice Payment Status"
    kind: release
    date: 2026-11-04
    description: "The billing page now shows whether each invoice is paid. If a charge failed, for example because a card expired, you can pay the invoice from a link."
  - product: cloud
    version: "Backup Size in the Cloud Console"
    kind: release
    date: 2026-11-03
    description: "The backup lists now show the size of each backup, so you can see how much storage each one uses."
  - product: cloud
    version: "io_uring Enabled by Default"
    kind: release
    date: 2026-10-23
    description: "On Qdrant 1.20 or later, Qdrant Cloud now enables asynchronous disk I/O (io_uring) automatically where the node supports it. You no longer set it yourself."
  - product: cloud
    version: "Stdout Audit Logs on Hybrid and Private Cloud"
    kind: release
    date: 2026-10-23
    description: "Hybrid Cloud and Private Cloud clusters can now write audit logs to standard output, so your log collector picks them up with the rest of your container logs. Requires Qdrant 1.20 or later."
  - product: cloud
    version: "Default Disk Usage Quota"
    kind: release
    date: 2026-10-23
    description: "Clusters on Qdrant 1.20 or later now have a default disk usage quota. When a disk is nearly full, Qdrant rejects new writes with a clear error, so you can free up space or scale up before the node fails."
  - product: cloud
    version: "Disk Downscaling"
    kind: release
    date: 2026-10-23
    description: "You can now reduce a cluster's disk size, for example after a temporary scale-up. Qdrant Cloud moves your data to nodes with smaller disks one at a time, without downtime."
  - product: cloud
    version: "Default Memory Usage Quota"
    kind: release
    date: 2026-10-23
    description: "Clusters on Qdrant 1.20 or later now have a default memory quota. When a node gets close to its limit, Qdrant rejects new writes with a clear error, so the node doesn't crash from running out of memory."
  - product: cloud
    version: "Migrate from Turbopuffer"
    kind: release
    date: 2026-10-16
    description: "The Qdrant Migration Tool can now copy vectors and attributes from Turbopuffer namespaces into Qdrant collections."
  - product: cloud
    version: "Node Downtime Reasons"
    kind: release
    date: 2026-09-23
    description: "When a node is down, the cluster overview now tells you why, for example out of memory, and what to do next. On Hybrid Cloud, it also shows why a node can't be scheduled in your Kubernetes cluster."
  - product: cloud
    version: "AWS PrivateLink for Hybrid Cloud"
    kind: release
    date: 2026-09-22
    description: "Hybrid Cloud environments on AWS can now reach the Qdrant Cloud control plane over AWS PrivateLink, including across regions, so management traffic from your Kubernetes cluster stays off the public internet."
  - product: cloud
    version: "Migrate from Azure AI Search"
    kind: release
    date: 2026-09-02
    description: "The Qdrant Migration Tool can now copy vectors and document fields from Azure AI Search into Qdrant collections."
  - product: cloud
    version: "Azure Private Link"
    kind: release
    date: 2026-08-28
    description: "Premium clusters on Azure can now accept traffic over Azure Private Link, so requests from your virtual network stay off the public internet. Qdrant Support sets up the connection."
  - product: cloud
    version: "New AWS Region: Canada"
    kind: release
    date: 2026-08-13
    description: "Managed Cloud is now available in AWS Canada (ca-central-1)."
  - product: cloud
    version: "New Load Balancer for Managed Cloud"
    kind: release
    date: 2026-08-13
    description: "Managed Cloud clusters now run behind a new load balancer that lowers request latency and gives snapshot uploads a longer timeout."
  - product: cloud
    version: "Fewer Permissions for the Hybrid Cloud Agent"
    kind: release
    date: 2026-08-13
    description: "The Qdrant Cloud agent now needs fewer permissions in your Kubernetes cluster."
  - product: cloud
    version: "Separate User and Account Settings"
    kind: release
    date: 2026-08-13
    description: "Your profile, appearance, security, and invitations now live in a user menu, separate from each account's settings. A new accounts overview lets you switch, create, or leave accounts."
  - product: cloud
    version: "Zone-Aware Routing for Multi-AZ Clusters"
    kind: release
    date: 2026-08-10
    description: "The load balancer in front of multi-AZ clusters is now zone-aware. It keeps each request inside one availability zone where it can."
  - product: cloud
    version: "Force Deletion for Hybrid Cloud Clusters"
    kind: release
    date: 2026-07-31
    description: "You can now force-delete Hybrid Cloud clusters and backups whose Kubernetes infrastructure is already gone, without contacting support."
  - product: cloud
    version: "Load Balancer IP Allowlists for Hybrid Cloud"
    kind: release
    date: 2026-07-07
    description: "You can now limit which IP ranges reach a Hybrid Cloud cluster's load balancer by setting loadBalancerSourceRanges in the Cloud Console or the Cloud API."
  - product: cloud
    version: "New Billing Page"
    kind: release
    date: 2026-07-01
    description: "The billing page now shows your usage and costs in one place. If you have a committed-spend contract, you can also see your credit balance and how you're using it."
  - product: cloud
    version: "Joint Billing for Multiple Accounts"
    kind: release
    date: 2026-06-29
    description: "Several Qdrant Cloud accounts that belong to one company can now be billed together."
  - product: cloud
    version: "Customer-Managed Encryption Keys on GCP"
    kind: release
    date: 2026-06-22
    description: "Premium clusters on GCP can now encrypt their storage with a key you own in Cloud KMS. Qdrant Support configures the cluster once your key is in place."
  - product: cloud
    version: "Simpler Hybrid Cloud Setup"
    kind: release
    date: 2026-06-19
    description: "Creating a Hybrid Cloud environment is now a guided flow. You pick storage classes from the values in your Kubernetes cluster when you create a Qdrant cluster, and the configuration is validated before you continue."
  - product: cloud
    version: "New GCP Region: Iowa"
    kind: release
    date: 2026-06-16
    description: "Managed Cloud is now available in GCP Iowa (us-central1)."
  - product: cloud
    version: "Next Steps After Creating a Cluster"
    kind: release
    date: 2026-06-12
    description: "After you create your first cluster, the API key dialog now shows next steps matched to the goal you chose at signup. Adding a key to an existing cluster stays a single step."
  - product: cloud
    version: "Active Alerts in the Cloud Console"
    kind: release
    date: 2026-06-10
    description: "Firing alerts now show on the cluster detail page in the Cloud Console, in addition to the email you already receive."
  - product: cloud
    version: "Break-Glass Users for SSO"
    kind: release
    date: 2026-06-09
    description: "Premium accounts with single sign-on (SSO) can now keep break-glass users who sign in without SSO, so you can still reach the Cloud Console if your identity provider is down. Qdrant Support sets them up on request."
  - product: cloud
    version: "Private Service Connect on GCP"
    kind: release
    date: 2026-06-09
    description: "Premium clusters on GCP can now accept traffic over Private Service Connect, so requests from your network stay off the public internet. Qdrant Support sets up the connection."
  - product: cloud
    version: "Qdrant Cloud CLI"
    kind: release
    date: 2026-06-02
    description: "You can now manage Qdrant Cloud from your terminal with qcloud. Create and scale clusters, manage API keys and backups, and set up Hybrid Cloud environments from scripts and CI pipelines."
  - product: cloud
    version: "Price Breakdown at Cluster Creation"
    kind: release
    date: 2026-05-19
    description: "The cluster creation summary now breaks the price down into base package, extra disk, and disk speed tier, so you see what each choice costs."
  - product: cloud
    version: "Per-Collection Metrics"
    kind: release
    date: 2026-05-06
    description: "Clusters now report API metrics per collection by default, so you can see which collection drives request volume and latency."
  - product: cloud
    version: "Redesigned Cluster List"
    kind: release
    date: 2026-05-06
    description: "The cluster list has a new card view and a cleaner table view, with search and filters. It shows status, version, region, and size at a glance, and works on mobile."
  - product: cloud
    version: "New GCP Regions: Zurich and Sydney"
    kind: release
    date: 2026-05-04
    description: "Managed Cloud is now available in GCP Zurich (europe-west6) and GCP Sydney (australia-southeast1)."
  - product: cloud
    version: "GPU Indexing on AWS"
    kind: release
    date: 2026-04-24
    description: "You can now add a GPU to paid clusters on AWS to build HNSW indexes up to 4x faster, based on Qdrant benchmarks. Requires nodes with 16 GiB RAM or more."
  - product: cloud
    version: "Multi-AZ Clusters"
    kind: release
    date: 2026-04-17
    description: "You can now spread a cluster across availability zones in one region, so it stays available if a zone goes down. Available on Premium, in regions with three or more zones."
  - product: cloud
    version: "Disk Speed Tiers on AWS"
    kind: release
    date: 2026-04-14
    description: "You can now choose a disk speed tier for clusters on AWS: Cost-Optimized, Balanced, or Performance. Faster tiers add IOPS and throughput for write-heavy and disk-based workloads, and switching doesn't restart your nodes."
  - product: cloud
    version: "Audit Logging for Clusters"
    kind: release
    date: 2026-04-13
    description: "You can now record every API call made to a cluster, with the action, time, API key or user, IP address, and result. Available on all paid clusters running Qdrant 1.17 or later."
  - product: cloud
    version: "Private Link Endpoints in Every Availability Zone"
    kind: release
    date: 2026-04-08
    description: "AWS PrivateLink endpoints for Premium clusters now cover every availability zone in a region, so the connection works whichever zones your network uses."
  - product: cloud
    version: "New AWS Region: Ohio"
    kind: release
    date: 2026-03-31
    description: "Managed Cloud is now available in AWS Ohio (us-east-2)."
  - product: cloud
    version: "New Cluster Scaling Page"
    kind: release
    date: 2026-03-30
    description: "You can now scale a cluster horizontally and vertically in one step, on a page that works like cluster creation. Scaling a free cluster makes clear that you're upgrading to a paid one."
  - product: cloud
    version: "More Cluster Alerts"
    kind: release
    date: 2026-03-17
    description: "Qdrant Cloud now emails account owners about more cluster problems, including CPU throttling, unhealthy nodes, uneven load across nodes, too many collections, and API keys about to expire. Each alert explains how to fix it."
  - product: cloud
    version: "Simpler User Invitations"
    kind: release
    date: 2026-03-10
    description: "You now choose a role when you invite someone to an account. When you assign roles, the Cloud Console suggests existing members as you type."
  - product: cloud
    version: "Topology Spread Constraints for Hybrid Cloud"
    kind: release
    date: 2026-02-10
    description: "You can now set Kubernetes topology spread constraints on Hybrid Cloud clusters to control how Qdrant pods spread across zones and nodes."
  - product: cloud
    version: "New Azure Regions: Tokyo and Washington"
    kind: release
    date: 2026-02-06
    description: "Managed Cloud is now available in Azure Tokyo (japaneast) and Azure Washington (westus2)."
  - product: cloud
    version: "Cluster Labels"
    kind: release
    date: 2026-01-21
    description: "You can now add key-value labels to clusters, for example for a team or cost center, and filter by them. Pick one label for cost attribution to see spend per label in consumption reports."
---
