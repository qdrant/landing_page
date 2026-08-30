---
label: DEPLOYMENT MODELS
title: What Resilience You Get on Each Deployment Model
tables:
  - id: resilience-deployment-model
    featureCellWidth: 23rem
    label: Access
    cols:
      - id: managedCloud
        name: Managed Cloud
        highlight: false
        bold: false
      - id: hybridPrivate
        name: Hybrid Private
        highlight: false
        bold: false
      - id: selfHosted
        name: Self-Hosted OSS
        highlight: false
        bold: false
    features:
      - name: Replication Factor <span>Set in Console</span>
        managedCloud: true
        hybridPrivate: true
        selfHosted: true
      - name: RAutomatic Failover <span>with RF 2+</span>
        managedCloud: true
        hybridPrivate: true
        selfHosted: true
      - name: Multi-A-Z
        managedCloud: Premium, Enabled at creation
        hybridPrivate: Your Kubernetes placement
        selfHosted: Customer operated, no topology aware shard distribution
      - name: Zero-downtime Upgrades
        managedCloud: Replicated
        hybridPrivate: Replicated
        selfHosted: Manual
      - name: Auto Rebalance
        managedCloud: true
        hybridPrivate: true
        selfHosted: ""
      - name: Backups
        managedCloud: Scheduled<br>+ on-demand (all paid)
        hybridPrivate: Scheduled<br>+ on-demand (all paid)
        selfHosted: Snapshot API
      - name: Uptime SLA
        managedCloud: 99.5% / 99.9%<br>Premium / 99.95%<br>Premium +  Multi-AZ
        hybridPrivate: Your Infrastructure
        selfHosted: ""
banner:
  content:
    The capabilities above apply to Qdrant Cloud. <br>The same resilience primitives run across every deployment model.
  link:
    url: /documentation/cloud/
    text: Compare Deployment Models (Docs)
sitemapExclude: true
---