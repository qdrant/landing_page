---
title: Capabilities Included with Every Cloud Cluster
description: Each capability is available through the Qdrant Cloud Console and the API.
tabs:
  - id: 0
    tab: Composable Search
    title: Composable Search for the Whole Retrieval Pipeline
    description: You choose how each query is ranked, filtered, and scored. Combine dense vectors, sparse vectors, and metadata filters at query time.
    features: 
      - id: 0
        icon: 
          src: /icons/outline/search-teal.svg
          alt: Search
        title: Hybrid Search
        description: Keyword and semantic search lives in the same engine. Dense and sparse vectors in one query. Native BM25 and SPLADE++ run alongside dense retrieval.
      - id: 1
        icon:
          src: /icons/outline/filter-teal.svg
          alt: Filter
        title: Filterable HNSW
        description: Latency stays predictable under filters. Filtering integrates with graph traversal, beyond pre- and post-filtering tradeoffs.
      - id: 2
        icon:
          src: /icons/outline/layers-3-teal.svg
          alt: Layers-3
        title: Built-in Multivector
        description: More precise multimodal search in one query. Store multiple vectors per object across text, image, audio, video.
      - id: 3
        icon:
          src: /icons/outline/trending-up-teal.svg
          alt: Trending up
        title: Full-Spectrum Reranking
        description: Apply business logic and token-level precision. Score boosting, ColBERT, and Maximum Marginal Relevance in-engine.
      - id: 4
        icon:
          src: /icons/outline/sliders-horizontal-teal.svg
          alt: Sliders horizontal
        title: Advanced Metadata Filters
        description: Enable more precise and efficient retrieval. Store metadata in JSON and use advanced filters, such as nested, text, geo, has_vector, and more.
      - id: 5
        icon:
          src: /icons/outline/refresh-cw-teal.svg
          alt: Refresh cw
        title: Ingestion and Updates
        description: Bulk upserts and streaming. Insert, update, and delete on a live index.
      - id: 6
        icon:
          src: /icons/outline/cloud-cog-teal.svg
          alt: Cloud
        title: Qdrant Cloud Inference
        description: Embed and query in one round trip. Native embedding generation inside a cluster.
      - id: 7
        icon:
          src: /icons/outline/thumbs-up-teal.svg
          alt: Thumbs up
        title: Recommendation API
        description: Get “more like this” with one API call. Positive and negative examples to find similar items.
  - id: 1
    tab: Control Performance
    title: Control Performance at Scale
    description: The same engine runs from in-memory dev to web-scale production. Tune memory, indexing speed, and capacity for each workload.
    features: 
      - id: 0
        icon:
          src: /icons/outline/minimize-2-green.svg
          alt: Minimize
        title: Quantization
        description: Up to 32× memory reduction. Scalar, TurboQuant, and binary help strike a balance between accuracy, storage efficiency, and search speed.
      - id: 1
        icon:
          src: /icons/outline/hard-drive-green.svg
          alt: Hard drive
        title: On-Disk Storage
        description: Offload cold vectors and payloads to disk to reduce RAM cost.
      - id: 2
        icon:
          src: /icons/outline/maximize-2-green.svg
          alt: Maximize
        title: Vertical and Horizontal Scaling
        description: Shards rebalance automatically, maintaining optimal performance. Scale clusters up, down, or out.
      - id: 3
        icon:
          src: /icons/outline/cpu-green.svg
          alt: Cpu
        title: GPU Indexing
        description: Up to 4× faster HNSW indexing. Every node in your cluster gets a dedicated GPU with a simple toggle.
      - id: 4
        icon:
          src: /icons/outline/users-green.svg
          alt: Users
        title: Flexible Multitenancy
        description: Serve thousands of tenants per cluster with payload-based separation. Promote noisy ones to dedicated while traffic continues.
      - id: 5
        icon:
          src: /icons/outline/circle-gauge-green.svg
          alt: Circle gauge
        title: SIMD and Async I/O
        description: SIMD acceleration across x86 and ARM. io_uring keeps disk throughput high on Cloud volumes.
  - id: 2
    tab: High Availability
    title: High Availability and Recovery
    description: Engine-handled operations on highly available clusters. Continuous backups and live upgrades.
    features: 
      - id: 0
        icon:
          src: /icons/outline/refresh-cw-purple.svg
          alt: Refresh cw
        title: Zero-Downtime Upgrades
        description: Engine upgrades run while the cluster serves traffic. Multi-version supported.
      - id: 1
        icon:
          src: /icons/outline/git-branch-purple.svg
          alt: Git branch
        title: Multi-AZ Replication
        description: Up to 99.95% SLA. Three availability zones with automatic failover.
      - id: 2
        icon:
          src: /icons/outline/database-purple.svg
          alt: Database
        title: Backups and Disaster Recovery
        description: Scheduled incremental backups, on-demand snapshots, and restore to any cluster.
      - id: 3
        icon:
          src: /icons/outline/download-purple.svg
          alt: Download
        title: Snapshot Export
        description: Export snapshots to your own object storage for long-term retention or DR.
      - id: 4
        icon:
          src: /icons/outline/life-buoy-purple.svg
          alt: Lifebuoy
        title: Engineering Support
        description: Guaranteed response times on critical incidents. Business-hours coverage on Standard, 24/7 on Premium.
  - id: 3
    tab: Defense in Depth
    title: Defense in Depth for Production Workloads
    description: Encryption on every channel and volume, granular access control, and private network options. Compliance-ready under SOC 2, HIPAA, and GDPR.
    features: 
      - id: 0
        icon:
          src: /icons/outline/shield-check-turquoise.svg
          alt: Shield check
        title: Compliance
        description: Reports available under NDA. SOC 2 Type II, HIPAA with BAA, and GDPR with DPA.
      - id: 1
        icon:
          src: /icons/outline/lock-open-turquoise.svg
          alt: Lock open
        title: Encryption in Transit
        description: End-to-end protection in flight. TLS 1.2+ on every API endpoint and replication channel.
      - id: 2
        icon:
          src: /icons/outline/hard-drive-turquoise.svg
          alt: Hard drive
        title: Encryption at Rest
        description: Storage protected by default; Premium adds customer-managed keys. AES-256 on storage volumes.
      - id: 3
        icon:
          src: /icons/outline/waypoints-turquoise.svg
          alt: Waypoints
        title: Private VPC Links
        description: Traffic stays on private networks. AWS PrivateLink and GCP Private Service Connect.
      - id: 4
        icon:
          src: /icons/outline/list-filter-turquoise.svg
          alt: List filter
        title: IP Allowlisting
        description: Define your network perimeter explicitly. Restrict cluster access to specific CIDR ranges.
      - id: 5
        icon:
          src: /icons/outline/key-round-turquoise.svg
          alt: Key
        title: Single Sign-On (SSO)
        description: Manage Cloud access through your existing identity provider. SAML 2.0 with Okta, Azure AD, Google and others.
  - id: 4
    tab: Monitoring and Recovery
    title: Monitoring and Observability Toolkit
    description: Monitor cluster health, audit every API call, and visualize capacity in real time. Configurable retention for compliance.
    features: 
      - id: 0
        icon:
          src: /icons/outline/activity-burgundy.svg
          alt: Activity
        title: Prometheus Metrics
        description: OpenMetrics-compatible /metrics and /sys_metrics endpoints on every cluster.
      - id: 1
        icon:
          src: /icons/outline/chart-line-burgundy.svg
          alt: Chart line
        title: Grafana Dashboard
        description: Reference dashboard for cluster health, query latency, and capacity.
      - id: 2
        icon:
          src: /icons/outline/file-text-burgundy.svg
          alt: File text
        title: Audit Logging
        description: "Logs every API operation: caller, target, and outcome in structured JSON."
      - id: 3
        icon:
          src: /icons/outline/bell-ring-burgundy.svg
          alt: Bell ring
        title: Capacity Alerts
        description: Alerts at 80% RAM and disk utilization, plus CPU throttling.
      - id: 4
        icon:
          src: /icons/outline/heart-pulse-burgundy.svg
          alt: Heart pulse
        title: Health Endpoints
        description: Kubernetes-style /healthz, /livez, /readyz on every node.
      - id: 5
        icon:
          src: /icons/outline/satellite-dish-burgundy.svg
          alt: Satellite dish
        title: Telemetry
        description: Per-segment, per-shard internals with configurable verbosity.
sitemapExclude: true
---
