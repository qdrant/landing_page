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
- id: oss
  name: OSS
  highlight: false
  bold: false
- id: free
  name: Free Tier
  highlight: false
  bold: false
- id: standard
  name: Standard Tier
  highlight: true
  bold: true
- id: premium
  name: Premium Tier
  highlight: false
  bold: true
sections:
- name: Core Vector Search Capabilities
  features:
  - name: Vector Similarity Search
    oss: true
    free: true
    standard: true
    premium: true
  - name: Recommendations & Discovery
    oss: true
    free: true
    standard: true
    premium: true
  - name: Quantization
    oss: true
    free: true
    standard: true
    premium: true
  - name: Hybrid Search
    oss: true
    free: true
    standard: true
    premium: true
  - name: Multi Vector Support
    oss: true
    free: true
    standard: true
    premium: true
  - name: Sparse Vector Support
    oss: true
    free: true
    standard: true
    premium: true
  - name: GPU Indexing
    oss: true
    free: false
    standard: false
    premium: false
  - name: Cloud Inference
    oss: false
    free: Only free models
    standard: true
    premium: true
- name: Data Modeling & Storage
  features:
  - name: Multi-Tenancy
    oss: true
    free: true
    standard: true
    premium: true
- name: Deployment & Enterprise
  features:
  - name: Cloud Providers
    oss: Depends on chosen infrastructure
    free: AWS, Azure, GCP
    standard: AWS, Azure, GCP
    premium: AWS, Azure, GCP
  - name: Uptime SLA
    oss: false
    free: false
    standard: "99.5"
    premium: "99.9"
- name: Developer Experience
  features:
  - name: Database Web UI
    oss: true
    free: true
    standard: true
    premium: true
  - name: Multi-Cluster Management UI
    oss: false
    free: true
    standard: true
    premium: true
  - name: Automation
    oss: false
    free: API, Terraform, Pulumi
    standard: API, Terraform, Pulumi
    premium: API, Terraform, Pulumi
- name: Querying / Ranking
  features:
  - name: Advanced Payload Filtering (Incl. Geo and Full-Text)
    oss: true
    free: true
    standard: true
    premium: true
  - name: Complex Payload Support
    oss: true
    free: true
    standard: true
    premium: true
  - name: Multi-Staged Queries
    oss: true
    free: true
    standard: true
    premium: true
  - name: Score Boosting
    oss: true
    free: true
    standard: true
    premium: true
- name: Scalability & Operations
  features:
  - name: Vertical Up & Downscaling
    oss: No resource usage safe guards
    free: false
    standard: true
    premium: true
  - name: Horizontal Up & Downscaling
    oss: No automated shard rebalancing
    free: false
    standard: true
    premium: true
  - name: Highly Availabe Setup
    oss: true
    free: false
    standard: true
    premium: true
  - name: Disk Performance Tiers
    oss: Depends on chosen infrastructure
    free: false
    standard: (AWS only)
    premium: (AWS only)    
  - name: Shard Splitting
    oss: false
    free: false
    standard: true
    premium: true      
  - name: Zero Downtime Upgrades
    oss: Custom automation
    free: false
    standard: true
    premium: true
  - name: Optimized Cluster Restarts
    oss: false
    free: false
    standard: true
    premium: true    
  - name: Monitoring & Alerting
    oss: Manual setup
    free: true
    standard: true
    premium: true
  - name: Backups & Disaster Recovery
    oss: Custom automation
    free: false
    standard: true
    premium: true
  - name: Dedicated Engineering Support During Migration
    oss: false
    free: false
    standard: false
    premium: true
  - name: Collection Snapshots
    oss: true
    free: true
    standard: true
    premium: true
- name: Security & Compliance
  features:
  - name: Create New Clusters from Backups
    oss: Custom automation
    free: false
    standard: true
    premium: true
  - name: JWT Based RBAC
    oss: true
    free: true
    standard: true
    premium: true
  - name: Built-in API Key Revocation
    oss: false
    free: true
    standard: true
    premium: true
  - name: SOC2 Type 2
    oss: false
    free: true
    standard: true
    premium: true
  - name: HIPAA
    oss: false
    free: false
    standard: true
    premium: true    
  - name: Encryption at Rest and in Transit
    oss: Depends on chosen infrastructure
    free: true
    standard: true
    premium: true       
  - name: Disk Encryption with Custom Key
    oss: Depends on chosen infrastructure
    free: false
    standard: false
    premium: (AWS only)
  - name: Enterprise SSO Authentication
    oss: false
    free: false
    standard: false
    premium: true
  - name: Private VPC Links
    oss: false
    free: false
    standard: false
    premium: true
  - name: Support Level
    oss: Community
    free: Community
    standard: Standard
    premium: Premium
  - name: Support Response Times
    oss: false
    free: Best effort
    standard: 10x5
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
- tier: standard
  text: Deploy on Cloud
  url: https://cloud.qdrant.io
  contained: true
- tier: premium
  text: Deploy on Cloud
  url: /contact-us/
  contained: false
sitemapExclude: true
---
