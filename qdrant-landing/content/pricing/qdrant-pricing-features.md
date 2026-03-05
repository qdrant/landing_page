---
title: Features by Tier
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
- name: Features
  features:
  - name: Cloud Inference
    oss: false
    free: Only external models
    paid: true
    premium: true
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
  - name: Automation
    oss: false
    free: API, Terraform, Pulumi
    paid: API, Terraform, Pulumi
    premium: API, Terraform, Pulumi
  - name: Vertical Up-Scaling
    oss: true
    free: false
    paid: true
    premium: true
  - name: Vertical Down-Scaling
    oss: No resource usage safe guards
    free: false
    paid: true
    premium: true
  - name: Vertical Disk Up-Scaling
    oss: Complex, manual process
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
onPremiseTiers:
- name: OSS
  highlight: false
- name: Free Tier
  highlight: false
- name: Paid Tier
  highlight: true
- name: Premium Tier
  highlight: false
onPremiseSections:
- name: Features
  features:
  - name: Cloud Inference (on-premise)
    oss: false
    free: Only external models
    paid: true
    premium: true
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
  - name: Automation
    oss: false
    free: API, Terraform, Pulumi
    paid: API, Terraform, Pulumi
    premium: API, Terraform, Pulumi
  - name: Vertical Up-Scaling
    oss: true
    free: false
    paid: true
    premium: true
  - name: Vertical Down-Scaling
    oss: No resource usage safe guards
    free: false
    paid: true
    premium: true
  - name: Vertical Disk Up-Scaling
    oss: Complex, manual process
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
onPremiseCtas:
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
