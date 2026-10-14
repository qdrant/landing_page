---
label: EDGE VECTOR SEARCH
title: Run Vector Search On Device
subtitle: Run Vector Search Inside Embedded and Edge AI Systems
description1: Qdrant Edge is an embedded vector search engine that runs inside your application process, with no Docker, no background service, and an install footprint of around 11 MB.
description2: Ship it on robots, kiosks, home assistants, and mobile phones, or anywhere connectivity is limited or intermittent, then sync with a central Qdrant server when you need to.
containedButton:
  text: Get Started
  url: /documentation/edge/edge-quickstart/
outlinedButton:
  text: Read Documentation
  url: /documentation/edge/
notice:
  text: Qdrant Edge is in beta as of August 2026. The API and functionality may change in future releases.
  icon:
    src: /icons/outline/circle-alert-grey.svg
    alt: Alert
codeBar: python
code: |
  pip install qdrant-edge-py

  from qdrant_edge import (
      Distance, EdgeConfig, EdgeShard,
      EdgeVectorParams, Query, QueryRequest,
  )

  config = EdgeConfig(
      vectors={"text": EdgeVectorParams(size=384, distance=Distance.Cosine)}
  )
  shard = EdgeShard.create("./edge", config)

  results = shard.query(
      QueryRequest(
          query=Query.Nearest(query_vector, using="text"),
          limit=10,
      )
  )
sitemapExclude: true
---

