---
label: Recall and Accuracy
title: Tune HNSW parameters and lift ann-recall on filtered queries
description: Once you have seen how Qdrant picks its execution path, the next question is how to get the accuracy you need from that path.
cards:
  - id: 0
    title: Set ef per request to trade performance for accuracy.
    description: Raising the HNSW ef parameter at query time improves search accuracy at the cost of performance.
    icon:
      src: /icons/outline/award-blue.svg
      alt: ""
  - id: 1
    title: Store UUID values with the dedicated uuid type.
    description: In addition to the basic keyword type, Qdrant supports a uuid type for storing UUID values.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Search and filter together through extra HNSW graph edges.
    description: Extra edges in the HNSW index let Qdrant traverse toward nearby vectors and apply filters during that graph walk. Filtering runs alongside the search, preserving recall even under tight filter conditions.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
callout:
  text: OpenTable Queries often narrowed results to a single restaurant out of more than 60,000, which placed heavy demands on filtering performance.
  url: https://qdrant.tech/blog/case-study-opentable/
button:
  text: Read the filterable HNSW docs
  url: https://qdrant.tech/documentation/manage-data/indexing
sitemapExclude: true
---
