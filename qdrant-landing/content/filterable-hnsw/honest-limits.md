---
label: Where it helps less
title: Watch Unindexed Segments and Over-strict Filters
cards:
  - id: 0
    title: Check which segments carry indexes and which do not.
    description: Not all segments automatically have indexes.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 1
    title: Apply custom filtering knowing neither index alone covers every case.
    description: A payload index and a vector index each address part of the filtered search problem, but neither can completely address it on its own.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 2
    title: Size your filter scope before benchmarking dimensions at scale.
    description: A full scan is not viable across too many vectors, and the HNSW graph starts to fall apart under filters that are too strict, so the middle of the selectivity range is where the extra edges do the work.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
button:
  text: Talk to engineering
  url: https://qdrant.tech/contact-us/
sitemapExclude: true
---
