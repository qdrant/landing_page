---
figure: /img/rethink-reranking/learned-ranker.svg
figureAlt: 'Today the model scores the whole pool; with Qdrant the stages hand it a short list'
title: Hand Your Model the Short List It Deserves
description: An enterprise retailer ranks its top few hundred results with its own trained model. Qdrant hands your model the candidates after fusion, rescoring, and rules. Start at 10 candidates and raise the count once a win holds, since every candidate takes a forward pass. In Qdrant's tests on five public datasets, only jina-reranker-v2 ever beat tuned fusion. Read that as directional.
callout:
  text: 'GoPerfect: runs hybrid search over more than 200 million profiles.'
  url: https://qdrant.tech/blog/case-study-go-perfect/
  label: Read the GoPerfect case study
sitemapExclude: true
---
