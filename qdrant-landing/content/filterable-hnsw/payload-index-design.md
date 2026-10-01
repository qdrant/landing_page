---
label: Payload Index Design
title: Index the right filtering attributes for accurate HNSW results
cards:
  - id: 0
    title: 'Read the article: payload indexes reshape filtered search results dramatically.'
    description: Payload indexes have a dramatic impact on filtering. Being too strict about filters on unindexed fields, as the article describes, changes results significantly.
  - id: 1
    title: Keep production queries from hitting unindexed filtering attributes.
    description: Consider blocking queries that filter on fields with no payload index. This prevents slow, unoptimized scans from reaching your HNSW graph at query time.
  - id: 2
    title: Create payload indexes before ingesting data into the collection.
    description: Create payload indexes before you ingest data.
  - id: 3
    title: Configure index parameters at the collection level.
    description: The indexes in each segment exist independently, and the parameters governing those indexes apply across the whole collection.
button:
  text: Read the filterable-hnsw docs →
  url: https://qdrant.tech/documentation/manage-data/indexing/#on-disk-payload-index
sitemapExclude: true
---
