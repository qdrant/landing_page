---
draft: false
id: 1
title: Single node benchmarks
description: Benchmarks with only 1 node. This is a good starting point for small-medium scale projects.

hundred_thread_title: For backend services (RPS is important)
hundred_thread_description: The most common requiremement is to have vector dbs running with backend services. In this case, RPS is the most important factor because of parallel requests and we should try to use all the CPU resources. So we will try with 100 parallel clients.
hundred_thread_data: /benchmarks/results-100-thread.json

single_thread_title: For realtime systems (Latency is important)
single_thread_description: Another common requiremement is to have vector dbs powering systems that need to take action in realtime. In this case, latency becomes the most important factor. So for that we will use only 1 concurrent search thread so different vector DBs can do their best in terms of latency. Remember that we are still batching the queries.
single_thread_data: /benchmarks/results-1-thread.json

preview_image: /benchmarks/benchmark-1.png
date: 2022-08-23
weight: 2
---

### Tested datasets

Our [benchmark tool](https://github.com/qdrant/vector-db-benchmark) is inspired by [github.com/erikbern/ann-benchmarks](https://github.com/erikbern/ann-benchmarks/). We used the following datasets to test the performance of the engines on ANN Search tasks:

<div class="table-responsive">

| Datasets              | # Vectors | # Dimensations | Distance |
|-----------------------|-------------------|-----------------------|-------------------|
| [deep-image-96-angular](http://sites.skoltech.ru/compvision/noimi/) | 9,990,000         | 96                    | cosine            |
| [gist-960-euclidean](http://corpus-texmex.irisa.fr/)    | 1,000,000         | 960                   | euclidean         |
| [glove-100-angular](https://nlp.stanford.edu/projects/glove/)     | 1,183,514         | 100                   | cosine            |
| [dbpedia-openai-1M-angular](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) | 1,000,000     | 1536                  | cosine            |

</div>

### Setup

```text
 ┌────────┐      ┌──────────┐
 │        ├─────►│          │
 │ Client │      │  Engine  │
 │        │◄─────┤          │
 └────────┘      └──────────┘
```

- This was our setup for this experiment:
    - Client: 8 vcpus, 16 GiB memory, 64GiB storage (`Standard D8ls v5` on Azure Cloud)
    - Server: 8 vcpus, 32 GiB memory, 64GiB storage (`Standard D8s v3` on Azure Cloud)
- The Python Client uploads data to the server, waits for all required indexes to be constructed, and then performs searches with multiple threads. We repeat this process with multiple different configurations for each engine, and then select the best one for a given precision.
- We ran all the engines in docker and limited their memory to 25Gb by means of Docker (read [this](https://qdrant.tech/articles/memory-consumption/#minimal-ram-you-need-to-serve-a-million-vectors) to learn why).

## How to read the results

- Choose the dataset and the metric you want to check.
- **Select a precision threshold** that would be satisfactory for your usecase.
- The table under the chart will get automatically refreshed and will only display the best results of each of the engines (i.e. engines with >= selected precision), with all its configuration properties.
- The table is sorted by the value of the selected metric (RPS / Latency / p95 latency / Index time), and the first entry is always the winner of the category 🏆

The graph displays the best configuration / result for a given precision, so it allows us to avoid visual and measurement noise.

Please note that **some of the engines might not satisfy the precision criteria, if you select a really high threshold. Some of them also failed on a specific dataset, due to memory issues (25GB limit)**. That’s why the list may sometimes be incomplete and not contain all the engines.

## Side notes

* `Redis` took over 8 hours to complete with indexing the `deep-image-96-angular`. That’s why we interrupted the tests and didn’t include those results.
* `Weaviate` was able to index the `deep-image-96-angular` only with the lightweight configuration under a given limitations (25Gb RAM). That’s why there are only few datapoints with low precision for this dataset and Weaviate on the plot.

## Conclusions

Some of the engines are clearly doing better than others and here are some interesting findings of us:

* **`Qdrant` achives highest RPS and lowest latencies in almost all the scenarios, no matter the precision threshold and the metric we choose.**
* `Qdrant` and `Milvus` are generally the fastest engines. Plus, the time they need to build internal search structures is 3-10x lower depending on config.
* `Redis` does better than the others while using one thread only. When we just use a single thread, the bottleneck is likely to be the python clients, not the servers, where `Redis`'s custom protocol gives it an advantage. However, Redis is architecturally limited to only a single thread execution, which makes it impossible to scale vertically.
* There is a noticeable difference between engines that try to do a single HNSW index and those with multiple segments. Single-segment leads to higher RPS but lowers the precision and higher indexing time. `Qdrant` allows you to configure the number of segments to achieve your desired goal.
