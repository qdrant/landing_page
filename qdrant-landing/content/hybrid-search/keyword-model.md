---
label: Keyword models
title: Pick the Keyword Model That Fits Your Data
description: The keyword side of hybrid search is a sparse vector, and Qdrant supports several ways to produce one. BM25 is Qdrant's full-text search and the default choice. Learned sparse models expand or disambiguate terms when plain word matching falls short.
variant: list
table:
  featureCellWidth: 10rem
  cols:
    - id: does
      name: What It Does
    - id: pick
      name: Pick It When
    - id: catch
      name: The Catch
  features:
    - name: BM25
      does: Scores exact terms, weighting rare words higher. Qdrant computes IDF at query time, with tokenization, lowercasing, ASCII folding, stemming, stopwords, and multilingual support.
      pick: Queries carry SKUs, part numbers, error codes, names, or mixed languages.
      catch: Matches words, so a paraphrase with different words scores zero.
    - name: SPLADE
      does: A neural model expands the query and documents with related terms before scoring.
      pick: Queries describe things in words the documents use differently.
      catch: Its trained vocabulary can miss product IDs and rare identifiers. Heavier at ingest.
    - name: miniCOIL
      does: BM25-style scoring where each term also carries a small vector for its meaning in context.
      pick: The same word means different things across your corpus, and exact matching alone misranks them.
      catch: Newer model with less public benchmark coverage.
notes:
  - 'Where it runs: on Qdrant Cloud, Cloud Inference computes BM25 and the other supported sparse models from text at upsert and query time. Self-hosted, FastEmbed runs the same models in your client.'
links:
  - text: Full-text search docs
    url: /documentation/search/text-search/full-text-search/
  - text: Sparse vectors docs
    url: /documentation/manage-data/vectors/#sparse-vectors
  - text: Cloud Inference docs
    url: /documentation/inference/cloud-inference/
sitemapExclude: true
---
