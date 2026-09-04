---
label: QUANTIZATION
title: Cut Your Memory Footprint at Scale
description: Quantization keeps only the compressed vectors in RAM and moves the full-precision originals to disk, so you can fit more into every node. Not only does this reduce cost, but it also increases speed.
button:
  text: Explore the Quantization Docs
  url: /documentation/manage-data/quantization/
codeBar: python
code: |
  from qdrant_client import QdrantClient, models

  client = QdrantClient(url="http://localhost:6333")
  
  client.query_points(
      collection_name="{collection_name}",
      query=[0.2, 0.1, 0.9, 0.7],
      search_params=models.SearchParams(
          quantization=models.QuantizationSearchParams(
              ignore=False,
              rescore=True,
              oversampling=2.0,
          )
      ),
  )
sitemapExclude: true
---

