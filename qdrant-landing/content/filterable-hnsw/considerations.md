---
label: Special considerations
title: Plan for Updates, Memory, and Tenants
variant: grid
cards:
  - title: Upserts.
    description: When field values change, you upsert the point, and updated points are searchable right away.
    icon:
      src: /icons/outline/square-pen-blue.svg
  - title: Memory and index volume.
    description: Filtering costs memory. Estimate memory and index volume with the sizing calculator.
    icon:
      src: /icons/outline/disk-storage-blue.svg
    links:
      - text: Size your cluster
        url: https://cloud.qdrant.io/calculator
      - text: Learn more about the on-disk payload index
        url: /documentation/manage-data/indexing/#on-disk-payload-index
  - title: Dedicated subgraph for every tenant.
    description: Bayer used Qdrant payload indexes to build per-tenant subgraphs so one team's 50,000 documents do not slow down another team's 500.
    icon:
      src: /icons/outline/multitenancy-blue.svg
    links:
      - text: Read the Bayer case study
        url: /blog/case-study-bayer/
  - title: Setup.
    description: Create your payload indexes before you ingest data, so the HNSW graph is built with the extra edges from the start.
    icon:
      src: /icons/outline/guide-blue.svg
    links:
      - text: See the payload index docs
        url: /documentation/manage-data/indexing/#payload-index
links:
  - text: Talk to engineering
    url: /contact-us/
sitemapExclude: true
---
