---
label: What you get
title: Find What Users Want Next, Using Examples They Already Gave You
description: Likes, past purchases, and session spikes carry real intent. Feeding those signals back as examples lets you surface what a user wants before they know how to ask for it.
snippet:
  lang: http
  source: 'https://qdrant.tech/documentation/search/explore/#recommendation-api'
  label: See the full recommendation API query
  code: |
    POST /collections/{collection_name}/points/query
    {
    "query": {
    "recommend": {
    "positive": [100, 231],
    "negative": [718, [0.2, 0.3, 0.4, 0.5]],
    "strategy": "average_vector"
    }
    },
    "filter": {
    "must": [
    {
    "key": "city",
    "match": {
    "value": "London"
    }
    }
    ]
    }
    }
cards:
  - id: 0
    title: Query recommendations through the same API path you already use for search.
    description: Qdrant exposes the recommendation API as the Recommend Query inside the Query API, so recommendation requests travel the same path as your existing search calls.
    icon:
      src: /icons/outline/code-xml-blue.svg
      alt: ""
  - id: 1
    title: Store user and item embeddings in separate collections of the same type.
    description: User and item embeddings that share the same distance type and dimensionality can live in different collections. That separation is the usual setup for recommendation workloads where user profiles and item catalogs are managed independently.
    icon:
      src: /icons/outline/layers-blue.svg
      alt: ""
  - id: 2
    title: Fetch candidate vectors from the external collection by id.
    description: Qdrant retrieves vectors from the external collection using the ids you supply in the positive and negative lists.
    icon:
      src: /icons/outline/puzzle-blue.svg
      alt: ""
callout:
  text: Pento used Qdrant Recommendation API to recommend artists aligned with each user's current aesthetic.
  url: https://qdrant.tech/blog/case-study-pento/
  label: Read the Pento case study
sitemapExclude: true
---
