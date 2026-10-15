---
label: What's included
title: Get Recommendations When User Embeddings Live in a Separate Collection
cards:
  - id: 0
    title: Run the recommendation against the current collection using those vectors.
    description: Those retrieved vectors are then compared against the vectors in the current collection, using the named or default vector to score candidates.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Sum scores across multiple query vectors to combine signals.
    description: When you supply multiple query vectors simultaneously, Qdrant can sum their individual scores against each candidate to produce a single ranked result.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
callout:
  text: ConvoSearch used Qdrant's metadata handling to incorporate extensive product data and user interactions, dramatically improving recommendation accuracy.
  url: https://qdrant.tech/blog/case-study-convosearch/
  label: Read the ConvoSearch case study
sitemapExclude: true
---
