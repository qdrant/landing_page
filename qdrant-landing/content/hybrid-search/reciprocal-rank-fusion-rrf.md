---
label: What's included
title: Weight Each Retriever to Make Hybrid Search Work
cards:
  - id: 0
    title: Check how rank fusion shapes your final results.
    description: RRF combines two ranked lists into one, so understanding how it scores each position helps you tune retrieval before you ship.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Define rank positions with zero-based indexing.
    description: Qdrant uses zero-based rank positions, so the top result in each list carries a rank distance of 0.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
  - id: 2
    title: Compare retriever weights before equal weighting drags results down.
    description: Assigning equal weight to both retrievers can let the weaker one pull down the final ranked list.
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: ""
  - id: 3
    title: Sum normalized scores across all retrievers with DBSF.
    description: Normalized scores are summed across retrievers.
    icon:
      src: /icons/outline/chart-bar-blue.svg
      alt: ""
button:
  text: Learn more about Distribution Based Score Fusion (DBSF)
  url: https://qdrant.tech/documentation/search/hybrid-queries/#distribution-based-score-fusion-dbsf
sitemapExclude: true
---
