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
    target: For development, testing, and prototypes
    features:
    - 1GB RAM/ 4 GB Disk.
    - 1 Node / 0.5 vCPU
    - Free Cloud Inference with selected models
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
    target: For production workloads and scaling applications
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
      - Data residency
      - Regulated workloads
      - Zero-ops in your own cloud
    - label: "Benefits:"
      items:
      - Data stays in your VPC
      - Fully managed through Qdrant Cloud
      - Production-grade uptime
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
      - Large enterprises
      - Sensitive workloads
      - Air-gapped setups
    - label: "Benefits:"
      items:
      - "Custom SLAs & security"
      - Full isolation
    cta:
      text: Talk to Our Engineers
      url: /contact-us/
      style: contained
sitemapExclude: true
---
