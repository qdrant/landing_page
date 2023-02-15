---
draft: false
id: 4
title: Filtered search benchmark
description: 

date: 2023-02-13
weight: 3
---

# Filtered search benchmark

Applying filters to search results brings a whole new level of complexity.
It is no longer enough to apply one algorithm to plain data. With filtering, it becomes a matter of the _cross-integration_ of the different indices.

To measure how well different engines perform in this scenario, we have prepared a set of **Filtered ANN Benchmark Datasets** -
 https://github.com/qdrant/ann-filtering-benchmark-datasets


It is similar to the ones used in the [ann-benchmarks project](https://github.com/erikbern/ann-benchmarks/) but enriched with payload metadata and pre-generated filtering requests. It includes synthetic and real-world datasets with various filters, from keywords to geo-spatial queries.

### Why filtering is not trivial?

Not many ANN algorithms are compatible with filtering.
HNSW is one of the few compatible, but different engines approach this problem differently.

Post-filtering applies filters after ANN search

- Some use **post-filtering**, which applies filters after ANN search. It doesn't scale well as it either looses results, or requires a large number of candidates on the first stage.
- Others use **pre-filtering**, which requires a binary mask of the whole dataset to be passed into ANN algorithm. It is also not scalable, as the mask size grows linearly with the dataset size.

On top of it, there is also a problem with search accuracy. 
It appears if too many vectors are filtered out, so the HNSW graph becomes disconnected.

Qdrant uses a different approach, not requiring pre- or post-filtering while addressing the accuracy problem.
Read more about the Qdrant approach in our [Filtrable HNSW](/articles/filtrable-hnsw/) article.