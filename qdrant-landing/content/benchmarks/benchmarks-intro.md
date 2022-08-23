---
draft: false
id: 2
title: How vector search databases should be tested?
weight: 1
---

# Benchmarking Vector Search Engines

As an Open Source vector search engine, we are often compared to the competitors and asked about our performance vs the other tools.
But the answer was never simple, as the world of vector databases lacked a unified open benchmark that would show the differences.
So we created one, making some bold assumptions about how it should be done.
Here we describe why we think that’s the best way.


In real-world scenarios, having access to unlimited power and computational resources is never the case. Projects have budgets that have to be tracked, and constraints affect the possibilities, also when it comes to hardware parameters.
Unless you work for a FAANG company, chances are you would like to get out most from your VMs or bare-metal servers.
That’s why we decided to benchmark the available vector databases using the same hardware configuration, so you can know how much you can expect from each on a specific setup.
Does it guarantee the best performance? Probably not, but that makes the whole process affordable and reproducible, so you can easily repeat it on your machine.
If you do so, your numbers won’t match the ones we’ve got.
But the whole thing is not about measuring the state-of-the-art performance of a specific neural network on a selected task.
**The relative numbers, compared to the other engines are far more important, as they emphasize the differences in reality.**


The list will be updated:

* Upload & Search speed on single node - [Benchmark](/benchmarks/single-node-speed-benchmark/)
* Memory consumption benchmark - TBD
* Filtered search benchmark - TBD
* Cluster mode benchmark - TBD

Some of our experiment design decisions are described at [F.A.Q Section](/benchmarks/#benchmarks-faq).

Suggest your variants of what you want to test in our [Discord channel](https://qdrant.to/discord)!


