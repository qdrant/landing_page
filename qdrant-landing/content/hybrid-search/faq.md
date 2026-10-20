---
title: FAQs
questions:
  - id: 0
    question: What does hybrid search mean in Qdrant?
    answer: Two searches over the same query, one dense and one sparse, run in parallel inside one request and merge into a single ranked list through fusion. Prefetch followed by reranking is a different pattern. One search generates candidates and a second stage reorders them. Both use the Query API, and you can combine them, as the Merge and Rerank section shows.
  - id: 1
    question: How do I rerank or combine results from multiple retrievers?
    answer: Fusion combines them. RRF ranks by position, DBSF ranks by rescaled score, and both run on the server. To rerank, add a stage to the same request with a late-interaction model stored as a multivector. Cross-encoder rerankers run in your application on the candidates Qdrant returns.
  - id: 2
    question: How should I weight the retrievers, and how do I know the weights are right?
    answer: Start with default RRF and measure it against each retriever alone on labeled queries. If one retriever is stronger, try DBSF before you touch weights. Tune weights last, and only on queries you didn't tune on. <a href="/documentation/search-tuning/how-to-tune-hybrid-search/">How to Tune Hybrid Search in Qdrant</a> walks through the order.
  - id: 3
    question: Can I group hybrid results by document?
    answer: Yes. Group by a payload field such as <code>document_id</code> so one document with many chunks takes one slot in the results. See <a href="/documentation/search/hybrid-queries/#grouping">grouping in hybrid queries</a>.
  - id: 4
    question: Does hybrid search run on open source and locally?
    answer: Yes. The Query API, sparse vectors, and full-text search are part of Qdrant open source. Qdrant Cloud computes the vectors for you with Cloud Inference, including on the free tier. Self-hosted, FastEmbed computes them in your client, with no hosted embedding API required.
  - id: 5
    question: Do I still need Elasticsearch or OpenSearch?
    answer: For BM25 keyword search alongside vectors, Qdrant covers it in one collection. If your queries depend on Lucene features Qdrant's full-text search lacks, such as fuzzy matching, keep that engine for those queries and run both.
sitemapExclude: true
---
