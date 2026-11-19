---
label: Filtered search
title: Keep Recall When Filters Tighten
description: Most production queries carry a filter. Qdrant adds filter-aware links to its graph index and plans each query, so filtered search keeps its recall as the filter narrows.
cards:
  - id: 0
    title: '99.9% to 100% recall across four filters.'
    description: 'In Qdrant''s published test on one million 96-dimension vectors, the default query planner held 99.9% to 100% recall@10 on every single-keyword filter, down to 0.012% of points.'
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Filter during the graph search.
    description: Index a payload field, and Qdrant links points that share its values, so the search walks a connected path to the nearest neighbors that match.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
sitemapExclude: true
---
