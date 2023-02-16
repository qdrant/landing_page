---
draft: false
id: 5
title: 
description: 

filter_data: /benchmarks/filter-result-2023-02-03.json
date: 2023-02-13
weight: 4
---


## Filtered Results

As you can see from the charts, there are three main patterns:

- **Speed boost** - for some engines/queries, the filtered search is faster than the unfiltered one. It might happen if the filter is restrictive enough, to completely avoid the usage of the vector index.

- **Speed downturn** - some engines struggle to keep high RPS, it might be related to the requirement of building a filtering mask for the dataset, as described above.

- **Accuracy collapse** - some engines are loosing accuracy dramatically under some filters. It is related to the fact that the HNSW graph becomes disconnected, and the search becomes unreliable.

Qdrant avoids all these problems and also benefits from the speed boost, as it implements an advanced [query planning strategy](/documentation/search/#query-planning).

<aside role="status">The Filtering Benchmark is all about changes in performance between filter and un-filtered queries. Please refer to the search benchmark for absolute speed comparison.</aside>
