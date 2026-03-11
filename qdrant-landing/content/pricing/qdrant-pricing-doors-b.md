---
tabs:
- id: managed
  label: Managed
  active: true
  tiers:
  - id: free
    title: Free Tier
    pricing: Free forever
    pricingNote: (No credit card required)
    target: For testing, and prototypes
    features:
    - 1GB RAM/ 4 GB Disk.
    - 1 Node / 0.5 vCPU
    - Free Cloud Inference With Selected Models
    cta:
      text: Start Free
      url: https://cloud.qdrant.io
      style: outlined
  - id: paid
    title: Standard Tier
    pricing: Usage-based pricing
    target: For production workloads and scaling applications
    features:
    - Dedicated Resources
    - Flexible Vertical and Horizontal Scaling
    - Highly Available Setups
    - Backup & Disaster Recovery
    - Free Tokens for Paid Inference Models
    - 99.5% Uptime SLA
    marketplace:
      label: Subscribe on Marketplace.
      logos:
      - name: AWS
        icon: aws
      - name: Google Cloud
        icon: gcp
      - name: Azure
        icon: azure
    cta:
      text: Deploy on Cloud
      url: https://cloud.qdrant.io
      style: contained
  - id: premium
    title: Premium Tier
    pricing: (minimum spend requirement)
    pricingNote: Committed Usage
    target: For enterprises with strict security and compliance needs
    features:
    - SSO
    - Private VPC Links
    - 99.9% Uptime SLA
    - Extra Support
    contactLink:
      text: Contact Sales
      url: /contact-us/
    cta:
      text: Talk to Our Engineers
      url: /contact-us/
      style: outlined
- id: on-premise
  label: On-Premise
  active: false
  tiers:
  - id: hybrid-cloud
    title: Hybrid Cloud
    badge: true
    target: Run managed Qdrant clusters on your own infrastructure using your compute, network and storage.
    featureGroups:
    - label: "Best for:"
      items:
      - Data Residency
      - Regulated Workloads
      - Zero-Ops in Your Own Cloud
    - label: "Benefits:"
      items:
      - Data Stays in Your VPC
      - Fully Managed Through Qdrant Cloud
      - Production-Grade Uptime
    cta:
      text: Talk to Our Engineers
      url: /contact-us/
      style: contained
  - id: private-cloud
    title: Private Cloud
    badge: true
    target: "Dedicated, isolated deployment. Fully customized environment for strict security, compliance, or performance needs."
    featureGroups:
    - label: "Best for:"
      items:
      - Large Enterprises
      - Sensitive Workloads
      - Air-Gapped Setups
    - label: "Benefits:"
      items:
      - Custom SLAs
      - Full Isolation
    cta:
      text: Talk to Our Engineers
      url: /contact-us/
      style: contained
sitemapExclude: true
---
