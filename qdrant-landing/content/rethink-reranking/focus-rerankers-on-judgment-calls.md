---
title: Focus Rerankers on Judgment Calls
description: Much of what a reranker does is sorting current, in-stock, in-policy results first. The query can carry that sorting, and the model keeps the judgment calls.
cards:
  - id: 0
    title: Sort exact from similar.
    description: Put prices, versions, locations, and stock in payload filters.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Make a tuned query the bar to beat.
    description: Tune fusion first, and keep a reranker only if its gain holds up on held-out queries.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
  - id: 2
    title: Try a planned model as a formula or a rescoring vector first.
    description: ""
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
sitemapExclude: true
---
