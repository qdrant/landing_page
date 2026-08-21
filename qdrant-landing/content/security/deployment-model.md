---
title: What Security You Get on Each Deployment Model
tables:
  - id: deployment-model
    featureCellWidth: 21rem 
    label: Access
    tiers:
      - id: qdrantCloud
        name: Qdrant Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/volumetric-logo.svg
          alt: Qdrant logo
      - id: hybridOrPrivateCloud
        name: Hybrid / Private Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-hybrid-blue.svg
          alt: Hybrid cloud
      - id: selfHosted
        name: Self-Hosted
        highlight: false
        bold: false
        icon:
          src: /icons/outline/server-green.svg
          alt: Server
    features:
      - name: Encryption in transit (TLS)
        qdrantCloud: Built-in
        hybridOrPrivateCloud: Customer configuration
        selfHosted: Customer configuration
      - name: Encryption at rest
        qdrantCloud: Built-in; Customer-provided keys (Premium)
        hybridOrPrivateCloud: Customer configuration
        selfHosted: Customer configuration
      - name: Audit Logging
        qdrantCloud: Available on paid clusters
        hybridOrPrivateCloud: Available on paid clusters
        selfHosted: Customer configuration
      - name: Cloud Management Console role-based access control (RBAC)
        qdrantCloud: Built-in
        hybridOrPrivateCloud: Built-in, Hybrid only
        selfHosted: Not applicable
      - name: Single sign-on (SSO)
        qdrantCloud: Premium add-on
        hybridOrPrivateCloud: Premium add-on<br>(Hybrid only)
        selfHosted: Not applicable
      - name: VPC PrivateLink
        qdrantCloud: Premium add-on
        hybridOrPrivateCloud: Not applicable
        selfHosted: Not applicable
      - name: Compliance documentation (SOC 2 Type 2, HIPAA)
        qdrantCloud: Available via <a href="https://app.drata.com/trust/9cbbb75b-0c38-11ee-865f-029d78a187d9">Trust Center</a>
        hybridOrPrivateCloud: Available via <a href="https://app.drata.com/trust/9cbbb75b-0c38-11ee-865f-029d78a187d9">Trust Center</a>
        selfHosted: Not applicable
sitemapExclude: true
---
