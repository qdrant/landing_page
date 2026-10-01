---
label: Filter Routing in Practice
title: Evaluate filter cardinality during filtering to gain precise results
cards:
  - id: 0
    title: Filter points in your vector database by payload alone.
    description: You can filter and modify points without knowing their ids. This means you can scope a query to any payload condition without first resolving which specific points match.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 1
    title: Keep conditions checked against matching value types during filtering.
    description: During filtering, Qdrant checks each condition only against values whose type matches the condition type. This keeps results consistent and avoids false matches from mixed-type payloads.
    icon:
      src: /icons/outline/filter-blue.svg
      alt: ""
  - id: 2
    title: Use queries not tied to payload for situations that call for it.
    description: Some query types in your vector database operate independently of payload entirely. These can be useful in specific situations where payload conditions are not the right tool.
    icon:
      src: /icons/outline/shield-check-blue.svg
      alt: ""
button:
  text: Read the filterable HNSW docs
  url: https://qdrant.tech/documentation/search/filtering
sitemapExclude: true
---
