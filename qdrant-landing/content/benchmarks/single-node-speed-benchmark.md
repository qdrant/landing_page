---
draft: false
id: 1
title: Single node speed benchmark
description: We benchmarked several engines using various configurations of them on 3 different datasets to check how the results may vary. Those datasets may have different vector dimensionality but also vary in terms of the distance function being used. We also tried to capture the difference we can expect while using some different configuration parameters, for both the engine itself and the search operation separately. It is also quite interesting to see how the number of search threads may impact the performance of the engines, so we added that option as well.

data: /benchmarks/result-2022-08-10.json
preview_image: /benchmarks/benchmark-1.png
weight: 2
---


## Benchmarking vector databases in a single node setup

We benchmarked several engines using various configurations of them on 3 different datasets to check how the results may vary.
Those datasets may have different vector dimensionality but also vary in terms of the distance function being used.
We also tried to capture the difference we can expect while using some different configuration parameters, for both the engine itself and the search operation separately.
It is also quite interesting to see how the number of search threads may impact the performance of the engines, so we added that option as well.


### Tested datasets

Our benchmark, inspired by [github.com/erikbern/ann-benchmarks/](https://github.com/erikbern/ann-benchmarks/), used the following datasets to test the performance of the engines:


| Datasets              | Number of vectors | Vector dimensionality | Distance function |
|-----------------------|-------------------|-----------------------|-------------------|
| deep-image-96-angular | 9,990,000         | 96                    | cosine            |
| gist-960-euclidean    | 1,000,000         | 960                   | euclidean         |
| glove-100-angular     | 1,183,514         | 100                   | cosine            |

### Hardware

In our experiments, we are not focusing on the absolute values of the metrics but rather on a relative comparison of different engines.
What is important is the fact we used the same machine for all the tests.
It was just wiped off between launching different engines. 

We selected an average machine, which you can easily rent from almost any cloud provider. No extra quota or custom configuration is required.

For this particular experiment, we used 8 CPUs and 32GB of RAM as a Server, with additionally timited memory to 25Gb by means of Docker, to make it exact.

And 8 CPUs + 16Gb RAM for client machine. We were trying to make it bottleneck on client side as wide as possible.



### Experiment setup

```
 ┌────────┐      ┌──────────┐
 │        ├─────►│          │
 │ Client │      │  Engine  │
 │        │◄─────┤          │
 └────────┘      └──────────┘
```

Python Client uploads data to the server, waits for all required indexe to be constructed, and then performs search with multiple threads. We repeat this process with multiple different configurations for each engine, and then select the best one for a given precision.

### Why we decided to test with the Python client


There is no consensus in the world of vector databases when it comes to the best technology to implement such a tool.
You’re free to choose Go, Java or Rust-based systems.
But you’re most likely to generate your embeddings using Python with PyTorch or Tensorflow, as according to stats it is the most commonly used language for Deep Learning.
Thus, you’re probably going to use Python to put the created vectors in the database of your choice either way.
For that reason, using Go, Java or Rust clients will rarely happen in the typical pipeline.
**Python clients are also the most popular clients among all the engines, just by looking at the number of GitHub stars.**

From the user’s perspective, the crucial thing is the latency perceived while using a specific library - in most cases a Python client.
Nobody can and even should redefine the whole technology stack, just because of using a specific search tool.
That’s why we decided to focus primarily on official Python libraries, provided by the database authors.
Those may use some different protocols under the hood, but at the end of the day, we do not care how the data is transferred, as long as it ends up in the target location.


## How to read the results

An interactive chart that allows you to check the results achieved by each engine under selected circumstances.
First of all, you can choose the dataset, the number of search threads and the metric you want to check.
Then, you can select a precision level that would be satisfactory for you.
After doing all this, the table under the chart will get automatically refreshed and will only display the best results of each of the engines, with all its configuration properties.
The table is sorted by the value of the selected metric (RPS / Latency / p95 latency / Index time), and the first entry is always the winner of the category 🏆

The graph displays best configuration / result for a given precision, so it allows us to avoid visual and measurement noize.  

Please note that some of the engines might not satisfy the precision criteria, if you select a really high threshold. Some of them also failed miserably on a specific dataset, due to i.e. memory issues. That’s why the list may sometimes be incomplete and not contain all the engines.

## Side notes

* Redis took over 8 hours to complete with indexing the `deep-image-96-angular`. That’s why we interrupted the tests and didn’t include those results.
* Weaviate was able to index the `deep-image-96-angular` only with the lightweight configuration under a given limitations (25Gb RAM). That’s why there are only few datapoints with low precision for this dataset and Weaviate on the plot.

## Conclusons

Some of the engines are clearly doing better than others and here are some interesting findings of us:

* Qdrant and Milvus are the fastest engines when it comes to indexing time. The time they need to build internal search structures is order of magnitude lower than for the competitors.
* Qdrant wins the competition on the biggest dataset we used, deep-image-96-angular with almost 10M of vectors. It achieves the best results no matter the precision threshold and the metric we choose.
* There is a noticeable difference between engines which tries to do a single HNSW index and ones with multiple segments. 
* Redis does better than the others while using one thread only. When we just use a single thread, the bottleneck might be the client, not the server. 
* Elasticsearch is typically way slower than all the competitors, no matter the dataset and metric.

## How to reproduce the benchmark

The source code is available on [Github](https://github.com/qdrant/vector-db-benchmark) and has a README file describing the process of running the benchmark for a specific engine.

## How to contribute

We made the benchmark Open Source because we believe that it has to be transparent. We could have misconfigured one of the engines or just done it inefficiently. If you feel like you could help us out, check out the [benchmark repository](https://github.com/qdrant/vector-db-benchmark).

