---
title: Across All Deployment Modes, Here Is What Qdrant Can Access
tables:
  - id: access
    featureCellWidth: 24rem
    label: Access
    cols:
      - id: qdrantCloud
        name: Qdrant Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/volumetric-logo.svg
          alt: Qdrant logo
      - id: hybridCloud
        name: Hybrid Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-hybrid-blue.svg
          alt: Hybrid cloud
      - id: privateCloud
        name: Private Cloud
        highlight: false
        bold: false
        icon:
          src: /icons/outline/cloud-private-teal.svg
          alt: Private cloud
    features:
      - name: Infrastructure metrics<br>(CPU, memory, disk)
        qdrantCloud: Visible to Qdrant
        hybridCloud: Visible to Qdrant
        privateCloud: Not Visible to Qdrant
      - name: Cluster metadata<br>(names, labels, collections)
        qdrantCloud: Visible to Qdrant
        hybridCloud: Visible to Qdrant
        privateCloud: Not Visible to Qdrant
      - name: Vectors, payloads, queries
        qdrantCloud: Stays in your cluster
        hybridCloud: Stays in your cluster
        privateCloud: Stays in your cluster
      - name: Database, stored data, API keys, backups, logs
        qdrantCloud: Qdrant Infrastructure
        hybridCloud: Your infrastructure, no Qdrant access
        privateCloud: Your infrastructure, no Qdrant access
      - name: Integrated management and observability
        qdrantCloud: Available
        hybridCloud: Available
        privateCloud: Not available (airgapped)
sitemapExclude: true
---
