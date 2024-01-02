---
draft: false
id: 1
title: Single node benchmarks
description: |
    We benchmarked several engines using various configurations of them on different datasets to check how the results may vary. Those datasets may have different vector dimensionality but also vary in terms of the distance function being used. We also tried to capture the difference we can expect while using some different configuration parameters, for both the engine itself and the search operation separately. </br> </br> <b> Updated: November 2023 </b>
single_node_title: Single node benchmarks
single_node_data: /benchmarks/results-1-100-thread.json
preview_image: /benchmarks/benchmark-1.png
date: 2022-08-23
weight: 2
Unlisted: false
---


## How to read the results

- Choose the dataset and the metric you want to check.
- Select a precision threshold that would be satisfactory for your usecase. This is important because ANN search is all about trading precision for speed. This means in an ANN benchmark, **two results should be compared only when you have similar precision**. However most ANN benchmarks miss this critical aspect.
- The table is sorted by the value of the selected metric (RPS / Latency / p95 latency / Index time), and the first entry is always the winner of the category 🏆

## Observations

Some of the engines are clearly doing better than others and here are some interesting findings of us:

* **`Qdrant` achives highest RPS and lowest latencies in almost all the scenarios, no matter the precision threshold and the metric we choose.**
* `Elasticsearch` is the considerably fast in many cases but it's always the slowest in terms of indexing time. It can be 10x slower when storing 10M+ vectors of 96 dimensions! (32mins vs 5.5 hrs)
* `Milvus` is the fastest when it comes to indexing time and maintains good precision. However, it's not on-par with others when it comes to RPS or latency when you have more dimensions or number of vectors.
* `Weaviate` has improved the least since [our last run](/benchmarks/single-node-speed-benchmark-2022). At the moment, it's the slowest in terms of RPS and has the highest latency.
* `Redis` is able to achieve good RPS however its latency is slower with parallel requests and is one of the slowest in terms of indexing time.



### Latency vs RPS

In our benchmark we test two main search usage scenarios that arise in practice.

- **Requests-per-Second (RPS)**: Serve more requests per second in exchange of individual requests taking longer (i.e. higher latency). This is a typical scenario for a web application, where multiple users are searching at the same time.
To simulate this scenario, we run client requests in parallel with multiple threads and measure how many requests the engine can handle per second.
- **Latency**: React quickly to individual requests rather than serving more requests in parallel. This is a typical scenario for applications, where server response time is critical. Self-driving cars, manufacturing robots, and other real-time systems are good examples of such applications.
To simulate this scenario, we run client in a single thread and measure how long each request takes.


### Tested datasets

Our [benchmark tool](https://github.com/qdrant/vector-db-benchmark) is inspired by [github.com/erikbern/ann-benchmarks](https://github.com/erikbern/ann-benchmarks/). We used the following datasets to test the performance of the engines on ANN Search tasks:

<div class="table-responsive">

| Datasets                                                                                          | # Vectors | Dimensions | Distance          |
|---------------------------------------------------------------------------------------------------|-----------|------------|-------------------|
| [dbpedia-openai-1M-angular](https://huggingface.co/datasets/KShivendu/dbpedia-entities-openai-1M) |  1M  | 1536       | cosine            |
| [deep-image-96-angular](http://sites.skoltech.ru/compvision/noimi/)                               |  10M | 96         | cosine            |
| [gist-960-euclidean](http://corpus-texmex.irisa.fr/)                                              |  1M  | 960        | euclidean         |
| [glove-100-angular](https://nlp.stanford.edu/projects/glove/)                                     | 1.2M | 100        | cosine            |

</div>

### Setup

{{< figure src=/benchmarks/client-server.png caption="Benchmarks configuration" width=70% >}}


- This was our setup for this experiment:
    - Client: 8 vcpus, 16 GiB memory, 64GiB storage (`Standard D8ls v5` on Azure Cloud)
    - Server: 8 vcpus, 32 GiB memory, 64GiB storage (`Standard D8s v3` on Azure Cloud)
- The Python client uploads data to the server, waits for all required indexes to be constructed, and then performs searches with configured number of threads. We repeat this process with different configurations for each engine, and then select the best one for a given precision.
- We ran all the engines in docker and limited their memory to 25Gb by means of Docker (read [this](https://qdrant.tech/articles/memory-consumption/#minimal-ram-you-need-to-serve-a-million-vectors) to learn why).

Please note that **some of the engines might not satisfy the precision criteria, if you select a really high threshold. Some of them also failed on a specific dataset, due to the memory limit (25 GB)**. That’s why the list may sometimes be incomplete and not contain all the engines.

