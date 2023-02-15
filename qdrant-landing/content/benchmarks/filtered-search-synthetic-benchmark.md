---
draft: false
id: 5
title: Synthetic data
description: 

filter_data: /benchmarks/synthetic-filter-result-2023-02-03.json
default_plot: rps
date: 2023-02-13
weight: 4
---


## Filtered Results

As you can see from the charts, there are three main scenario of the filtered search:

- **Speed boost** - if the number of data points that match the filter is small, it is better to use payload index first and then re-score all the results. That is an option of query planning, boosts the speed of search in some engines, if this feature is implemented.

- **Speed downturn** - some engines struggle to keep high RPS, it might be related to the requirement of building a filtering mask for the dataset, as described above.

- **Accuracy collapse** - some engines are loosing accuracy drammatically under some filters. It is related to the fact that the HNSW graph becomes disconnected, and the search becomes unreliable.

Qdrant avoids all these problems and also benefits from the speed boost, as it implements an advanced [query planning strategy](/documentation/search/#query-planning).

<aside role="status">The Filtering Benchmark is all about changes in performance between filter and un-filtered queries. Please refer to the search benchmark for absolute speed comparision.</aside>
