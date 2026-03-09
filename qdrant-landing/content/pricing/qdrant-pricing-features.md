---
title: Features by Tier
tables:
  - id: managed
    label: Managed
    tiers:
      - name: OSS
        highlight: false
      - name: Free Tier
        highlight: false
      - name: Standard Tier
        highlight: true
      - name: Premium Tier
        highlight: false
    sections:
      - name: Features
        features:
          - name: Cloud Inference
            oss: false
            free: Only free and external models
            paid: true
            premium: true
          - name: Cloud providers
            oss: Depends on chosen infrastructure
            free: AWS, Azure, GCP
            paid: AWS, Azure, GCP
            premium: AWS, Azure, GCP
          - name: Uptime SLA
            oss: false
            free: false
            paid: "99.5"
            premium: "99.9"
          - name: Automation
            oss: false
            free: API, Terraform, Pulumi
            paid: API, Terraform, Pulumi
            premium: API, Terraform, Pulumi
          - name: Vertical Up & Down Scaling
            oss: No resource usage safe guards
            free: false
            paid: true
            premium: true
          - name: Horizontal Up & Down-Scaling
            oss: No automated shard rebalancing
            free: false
            paid: true
            premium: true
          - name: Backup & Disaster Recovery
            oss: Custom automation
            free: false
            paid: true
            premium: true  
          - name: Shard Splitting
            oss: false
            free: false
            paid: true
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
          - name: Encryption at Rest and in Transit
            oss: Depends on chosen infrastructure
            free: true
            paid: true
            premium: true          
          - name: Disk Encryption with custom key
            oss: Depends on chosen infrastructure
            free: false
            paid: false
            premium: (AWS only)
          - name: Private VPC Links
            oss: N/A
            free: false
            paid: false
            premium: true          
          - name: Enterprise SSO authentication
            oss: false
            free: false
            paid: false
            premium: true
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


compareButton:
  text: Compare All Features
  url: /pricing/comparison/
sitemapExclude: true
---
