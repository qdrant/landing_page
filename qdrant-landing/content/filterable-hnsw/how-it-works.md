---
label: How it works
title: We Do Filtered Search Differently
variant: visual
image:
  src: /blog/pre-filtering-vs-post-filtering/query-routing.svg
  alt: The query planner routes each filtered query to a full scan, the payload index, or filterable HNSW, depending on how many points the filter keeps
cards:
  - title: Query planning.
    description: The planner routes queries per filter, choosing automatically between a full scan, retrieval from the payload index, and filterable HNSW, and adding ACORN on queries that opt in.
    icon:
      src: /icons/outline/switches-blue.svg
    links:
      - text: See how query planning works
        url: /documentation/search/search/#query-planning
  - title: Extra edges.
    description: Filterable HNSW adds extra edges at index time, keeping Qdrant's graph connected.
    icon:
      src: /icons/outline/network-blue.svg
    links:
      - text: Read more about filterable HNSW
        url: /documentation/manage-data/indexing/#filterable-hnsw-index
  - title: ACORN.
    description: Opt in per query, and Qdrant steps to a point's neighbors' neighbors when your filter rejects the direct ones, with no index-time changes. ACORN engages at the selectivity threshold you set.
    icon:
      src: /icons/outline/locate-fixed-blue.svg
    links:
      - text: Read the ACORN docs
        url: /documentation/manage-data/indexing/#the-acorn-search-algorithm
table:
  title: When Should You Turn On ACORN?
  featureCellWidth: 14rem
  cols:
    - id: looks
      name: What It Could Look Like in Your App
    - id: why
      name: Why ACORN Helps
  features:
    - name: Two filters applied together
      looks: '<code>region = "EU" AND doc_type = "contract"</code>. Each filter alone returns good results; the combination returns junk.'
      why: Keep accurate results on the combination while keeping memory cost low.
    - name: A filter value that is everywhere
      looks: A field like <code>status</code> or <code>language</code> where one value covers a big share of rows. Very common values are skipped.
      why: Get the repair only where you need it, which saves build time and memory.
    - name: Filters that leave a slice
      looks: A date range, one customer, one document type. Results get noticeably worse as the filter tightens.
      why: Hold accuracy as the filter tightens, which saves latency and improves recall.
    - name: Results that have gone obviously wrong
      looks: Users report nonsense matches on filtered queries. With fewer than about one usable link per point, the walk is almost random.
      why: Recover usable results, which saves latency and compute.
links:
  - text: Learn more about what ACORN fixes, and what fixes ACORN
    url: /articles/filtered-vector-search-acorn/
sitemapExclude: true
---
