---
label: Named vectors
title: Store Every Representation on the Same Point
variant: grid
cards:
  - title: One point, every vector.
    description: A point in Qdrant holds as many named vectors as you give it. A dense vector for meaning, a sparse vector for keywords, a multivector for late-interaction reranking, and an image embedding for the product photo. The payload lives on the point once, so stock, price, and tenant stay in sync across every search.
    icon:
      src: /icons/outline/layers-blue.svg
  - title: Choose vectors at query time.
    description: You choose which vectors a query uses with prefetch and using. Combine two today and add a third later without reindexing the rest.
    icon:
      src: /icons/outline/switches-blue.svg
  - title: Hybrid and multimodal stay separate.
    description: Hybrid search merges a keyword search and a semantic search over the same text. Multimodal search embeds images, audio, or video into vectors you can query alongside text. Both can run on the same collection, and you decide at query time whether to combine them.
    icon:
      src: /icons/outline/image-blue.svg
callout:
  text: Mixpeek used Qdrant's native Reciprocal Rank Fusion support to streamline retriever implementations, reducing hybrid search code by 80%.
  url: /blog/case-study-mixpeek/
  label: Read the Mixpeek case study
links:
  - text: Named vectors docs
    url: /documentation/manage-data/vectors/#named-vectors
  - text: Multivectors docs
    url: /documentation/manage-data/vectors/#multivectors
  - text: Multimodal search tutorial
    url: /documentation/tutorials-basics/multimodal-search/
sitemapExclude: true
---
