---
label: Where it helps less
title: Watch Prefetch Limits and SPLADE Vocabulary Gaps
cards:
  - id: 0
    title: Size each prefetch limit to cover the main query's limit plus offset.
    description: Each prefetch must return at least as many points as the sum of the main query's limit and offset; a prefetch limit set below that threshold can produce an empty result.
    icon:
      src: /icons/outline/binary-blue.svg
      alt: ""
  - id: 1
    title: Check SPLADE vocabulary gaps for product IDs and out-of-domain terms.
    description: SPLADE models rely on a fixed vocabulary from training, so they cannot match terms outside that vocabulary, including product IDs and words not seen during training.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
button:
  text: Talk to engineering
  url: https://qdrant.tech/contact-us/
sitemapExclude: true
---
