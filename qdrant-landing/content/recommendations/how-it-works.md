---
label: How it works
title: Create a Recommendation and See Each Step Qdrant Takes
steps:
  - number: 1
    title: Start with averagevector, Qdrant's default recommendation strategy.
    description: The default strategy Qdrant applies is called averagevector. It is the first strategy added to Qdrant and the one used when you post examples to the recommendations endpoint.
    icon:
      src: /icons/outline/layers-blue.svg
  - number: 2
    title: Create a single search vector from your posted examples.
    description: Qdrant preprocesses your positive and negative examples into one vector, which it then uses for the search step.
    icon:
      src: /icons/outline/puzzle-blue.svg
  - number: 3
    title: Get search performance on par with a regular query.
    description: Because the preprocessing step runs very fast, the full recommendation call matches the latency of a standard search. You can plan SLAs around it the same way.
    icon:
      src: /icons/outline/binary-blue.svg
button:
  text: Learn more about average vector strategy
  url: https://qdrant.tech/documentation/search/explore/#average-vector-strategy
sitemapExclude: true
---
