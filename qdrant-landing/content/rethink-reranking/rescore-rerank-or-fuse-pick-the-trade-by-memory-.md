---
title: 'Rescore, Rerank, or Fuse: Pick the Trade by Memory, Latency, and Inference Cost'
description: Rescoring spends memory, a reranker spends inference and latency, and fusion works with what the query already holds.
cols:
  - id: what-you-get
    name: What You Get
  - id: what-it-costs
    name: What It Costs
features:
  - name: Rescoring in the query
    what-you-get: A sharper order from a stored vector, with inference optional
    what-it-costs: Storage, at about 1/8 to 1/2 of float32 with TurboQuant
  - name: External reranker
    what-you-get: A model you pick
    what-it-costs: A forward pass per candidate, on your GPU or billed per call
  - name: Fusion by rank (RRF) or by score (DBSF)
    what-you-get: The lightest option, all in Qdrant
    what-it-costs: Ranks on positions or scores alone, so a model that reads the text can rank higher
button:
  text: Learn more about how to tune hybrid search
  url: https://qdrant.tech/documentation/search-tuning/how-to-tune-hybrid-search/
sitemapExclude: true
---
