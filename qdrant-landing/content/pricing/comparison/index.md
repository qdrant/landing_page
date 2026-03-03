---
title: Compare all Qdrant Cloud capabilities
description: A complete overview of the features available in each tier. See what's included in every plan and choose the setup that fits your use case and growth stage.
build:
  render: always
badge:
  text: For Hybrid/Private cloud
  linkText: Speak to Our Engineers
  url: /contact-us/
button:
  text: Talk to our Team
  url: /contact-us/
link:
  text: Try our Pricing Calculator
  url: /pricing/#calculator
tiers:
- name: OSS
  highlight: false
- name: Free Tier
  highlight: false
- name: Paid Tier
  highlight: true
- name: Premium Tier
  highlight: false
sections:
- name: Core Vector Search Capabilities
  features:
  - name: Vector Similarity Search
    oss: true
    free: true
    paid: true
    premium: true
  - name: Recommendations & Discovery
    oss: true
    free: true
    paid: true
    premium: true
  - name: Quantization
    oss: true
    free: true
    paid: true
    premium: true
  - name: Hybrid Search
    oss: true
    free: true
    paid: true
    premium: true
  - name: Multi Vector Support
    oss: true
    free: true
    paid: true
    premium: true
  - name: Sparse Vector Support
    oss: true
    free: true
    paid: true
    premium: true
  - name: GPU indexing
    oss: true
    free: false
    paid: false
    premium: false
  - name: Cloud Inference
    oss: false
    free: Only external models
    paid: true
    premium: true
- name: Data Modeling & Storage
  features:
  - name: Multi-Tenancy
    oss: true
    free: true
    paid: true
    premium: true
- name: Deployment & Enterprise
  features:
  - name: Cloud providers
    oss: Depends on customer infra
    free: AWS, Azure, GCP
    paid: AWS, Azure, GCP
    premium: AWS, Azure, GCP
  - name: Uptime SLA
    oss: false
    free: false
    paid: "99.5"
    premium: "99.9"
- name: Developer Experience
  features:
  - name: Database Web UI
    oss: true
    free: true
    paid: true
    premium: true
  - name: Multi-Cluster Management UI
    oss: false
    free: true
    paid: true
    premium: true
  - name: Automation
    oss: false
    free: API, Terraform, Pulumi
    paid: API, Terraform, Pulumi
    premium: API, Terraform, Pulumi
- name: Querying / Ranking
  features:
  - name: Advanced payload filtering (incl. Geo and full-text)
    oss: false
    free: true
    paid: true
    premium: true
  - name: Complex payload support
    oss: false
    free: true
    paid: true
    premium: true
  - name: Multi-Staged Queries
    oss: false
    free: true
    paid: true
    premium: true
  - name: Score Boosting
    oss: false
    free: true
    paid: true
    premium: true
- name: Scalability & Operations
  features:
  - name: Vertical Up-Scaling
    oss: true
    free: false
    paid: true
    premium: true
  - name: Vertical Down-Scaling
    oss: true
    free: false
    paid: true
    premium: true
  - name: Vertical Disk Up-Scaling
    oss: Complex, manual process
    free: false
    paid: true
    premium: true
  - name: Horizontal Scaling
    oss: true
    free: false
    paid: true
    premium: true
  - name: Read Replicas (HA)
    oss: true
    free: false
    paid: true
    premium: true
  - name: Zero Downtime Upgrades
    oss: false
    free: false
    paid: true
    premium: true
  - name: Auto Suspend
    oss: false
    free: true
    paid: true
    premium: true
  - name: Monitoring & Metrics
    oss: Manual setup
    free: true
    paid: true
    premium: true
  - name: Backups
    oss: Manual setup
    free: Daily
    paid: Daily
    premium: Hourly
  - name: Point in Time Recovery
    oss: false
    free: false
    paid: false
    premium: true
  - name: Multi-Region / Geo Replication
    oss: false
    free: false
    paid: false
    premium: true
  - name: Zero Downtime Migration
    oss: false
    free: false
    paid: true
    premium: true
  - name: Dedicated Engineering Support during Migration
    oss: false
    free: false
    paid: false
    premium: true
  - name: Pause Clusters
    oss: true
    free: false
    paid: true
    premium: true
  - name: Snapshots / Versioning
    oss: true
    free: true
    paid: true
    premium: true
  - name: Alerting
    oss: false
    free: true
    paid: true
    premium: true
- name: Security & Compliance
  features:
  - name: Create new Clusters from Backups
    oss: true
    free: false
    paid: true
    premium: true
  - name: Dedicated LoadBalancer
    oss: true
    free: false
    paid: false
    premium: true
  - name: TLS
    oss: true
    free: true
    paid: true
    premium: true
  - name: API Key Auth
    oss: true
    free: true
    paid: true
    premium: true
  - name: JWT based RBAC
    oss: true
    free: true
    paid: true
    premium: true
  - name: mTLS Peer Authentication
    oss: false
    free: false
    paid: false
    premium: true
  - name: SOC2 Type 2
    oss: false
    free: true
    paid: true
    premium: true
  - name: Disk Encryption with custom key
    oss: Depends on customer infra
    free: false
    paid: false
    premium: (AWS only)
  - name: Enterprise authentication (SSO in Cloud)
    oss: false
    free: false
    paid: false
    premium: true
  - name: Private Links (AWS Private Link, Azure Private Link, GCP PSC)
    oss: false
    free: false
    paid: false
    premium: true
  - name: Support Level
    oss: Community
    free: Community
    paid: Standard
    premium: Premium
  - name: Support Response times
    oss: false
    free: Best effort
    paid: 10x5
    premium: 24x7
ctas:
- tier: oss
  text: Start Free
  url: https://cloud.qdrant.io
  contained: false
- tier: free
  text: Start Free
  url: https://cloud.qdrant.io
  contained: false
- tier: paid
  text: Deploy on Cloud
  url: https://cloud.qdrant.io
  contained: true
- tier: premium
  text: Deploy on Cloud
  url: /contact-us/
  contained: false
sitemapExclude: true
---
