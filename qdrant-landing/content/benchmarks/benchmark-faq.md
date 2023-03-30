---
draft: false
id: 3
title: Benchmarks F.A.Q.
weight: 10
---

# Frequently Asked Questions 

## What are you measuring in this study?

The assessment of each engine was based on three criteria: **search precision**, **engine speed**, and **resource requirements**.
This benchmark depends on each engine meeting a specific search precision threshold. It is important to understand that comparing engine speeds only makes sense if they produce the same quality of results. Exclusively maximizing speed factors might provide inaccurate results and serves no practical use.
Future additions to this benchmark will account for different scenarios, ranging from a basic single node deployment to a distributed cluster.

## Which hardware did you use to run each engine?

This study gives a relative comparison of different engines on the same hardware setup. Hence, we ran the tests for each engine on one virtual machine, and we wiped it clean before each test. We intentionally used a basic machine without additional resources or custom configurations.

## Why are you not using libraries like FAISS or Annoy?

FAISS or Annoy are useful in experimentation, but they don't reflect real usage in production environments.
When using FAISS in production, you either never need to update it in real-time (best case), or you have to create a custom wrapper around it to support CRUD, high availability, horizontal scalability, and concurrent access.
Some vector search engines even use FAISS under the hood, but the search engine is much more than just an indexing algorithm.

We do use the same benchmark datasets as the famous [ann-benchmarks project](https://github.com/erikbern/ann-benchmarks), so you may align your expectations for any practical reasons. 

## Why are you using a Python client?

There is no general consensus on which technology is best when implementing vector databases. We chose to go this way because data shows that Python is the most common language in Deep Learning. In practice, you will likely generate embeddings using Python with PyTorch or Tensorflow. Furthermore, Go, Java or Rust clients are not common in a typical pipeline.

If we had a say in the industry standard, we would always recommend a Rust stack for strongest performance.

## Why are you not including closed-source SaaS platforms?

This would compromise the study and you would not be able to run the benchmark yourself. A fair comparison means that we need to test each engine under the same circumstances. We can't do this with closed-source SaaS options.
We will continue to research and add more open-source alternatives to this benchmark. The only options we will leave out are the ones that do not support relevant features.

## How does this benchmark stay objective?

It is difficult for any team to carry out a benchmark with complete objectivity, but we did make every attempt to carry out the study in a fair and transparent way.
Comparing open-source engines allowed us to take full advantage of documentation. We tinkered with different configurations to get the most out of each engine. 

## How can I reproduce the benchmark?

We are proud to make this study fully transparent on [GitHub](https://github.com/qdrant/vector-db-benchmark). Please try the process as outlined in README and run the benchmark yourself. All feedback is valuable to us. If we missed some important tweaks to one of the engine, please let us know. 
