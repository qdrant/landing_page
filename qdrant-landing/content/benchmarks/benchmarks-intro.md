---
draft: false
id: 2
title: How vector search databases should be tested?
description: As an Open Source vector search engine, we are often compared to the competitors and asked about our performance vs the other tools. But the answer was never simple, as the world of vector databases lacked a unified open benchmark that would show the differences. So we created one, making some bold assumptions about how it should be done. Here we describe why we think that’s the best way.
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


## Are we biased?

Of course, we are! Even if we try to be objective, we are not experts in using all the existing vector databases.
We develop Qdrant and try to make it stand out from the crowd.
Due to that, we could have missed some important tweaks in different engines.

We tried our best, kept scrolling the docs up and down, and experimented with different configurations to get the most out of the tools. However, we believe you can do it better than us, so all **benchmarks are fully open-sourced, and contributions are welcome**!


## How we select hardware?

In our experiments, we are not focusing on the absolute values of the metrics but rather on a relative comparison of different engines.
What is important is the fact we used the same machine for all the tests.
It was just wiped off between launching different engines. 

We selected an average machine, which you can easily rent from almost any cloud provider. No extra quota or custom configuration is required.


## What do we measure?

There are several factors considered while deciding on which database to use.
Of course, some of them support a different subset of functionalities, and those might be a key factor to make the decision.
But in general, we all care about the search precision, speed, and resources required to achieve it.

There is one important thing - **the speed of the engines has to be compared only if they achieve the same precision**. Otherwise, they could maximize the speed factors by providing inaccurate results, which everybody would rather avoid. Thus, our benchmark results are compared only at a specific search precision threshold.

We currently have planned measurements in several scenarios, from the most standard - single node deployment to a distributed cluster.

The list will be updated:

* Upload & Search speed on single node - [Benchmark](/benchmarks/single-node-speed-benchmark/)
* Memory consumption benchmark - TBD
* Filtered search benchmark - TBD
* Cluster mode benchmark - TBD

Suggest your variants of what you want to test in our [Discord channel](https://qdrant.to/discord)!


## Why you are not comparing with FAILSS or Annoy?

Libraries like FAISS provide a great tool to do experiments with vector search. But they are far away from real usage in production environments.
If you are using FAISS in production, in the best case, you never need to update it in real-time. In the worst case, you have to create your custom wrapper around it to support CRUD, high availability, horizontal scalability, concurrent access, and so on.

Some vector search engines even use FAISS under the hood, but the search engine is much more than just an indexing algorithm.

We do, however, use the same benchmark datasets as the famous [ann-benchmarks project](https://github.com/erikbern/ann-benchmarks), so you can align your expectations for any practical reasons. 


## Why are you using Python client?

There is no consensus in the world of vector databases when it comes to the best technology to implement such a tool.
You’re free to choose Go, Java or Rust-based systems. 
But you’re most likely to generate your embeddings using Python with PyTorch or Tensorflow, as according to stats it is the most commonly used language for Deep Learning.
Thus, you’re probably going to use Python to put the created vectors in the database of your choice either way.
For that reason, using Go, Java or Rust clients will rarely happen in the typical pipeline - although, we encourage you to adopt Rust stack if you care about the performance of your application.
Python clients are also the most popular clients among all the engines, just by looking at the number of GitHub stars.


## What about closed-source SaaS platforms?

There are some vector databases available as SaaS only so that we couldn’t test them on the same machine as the rest of the systems.
That makes the comparison unfair. That’s why we purely focused on testing the Open Source vector databases, so everybody may reproduce the benchmarks easily.

This is not the final list, and we’ll continue benchmarking as many different engines as possible.
Some applications do not support the full list of features needed for any particular benchmark, in which case we will exclude them from the list.


