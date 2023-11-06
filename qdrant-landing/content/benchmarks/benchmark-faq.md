---
draft: false
id: 3
title: Benchmarks F.A.Q.
weight: 10
---


# Benchmarks F.A.Q.

## What do we measure?

There are several factors considered while deciding on which database to use.
Of course, some of them support a different subset of functionalities, and those might be a key factor to make the decision.
But in general, we all care about the search precision, speed, and resources required to achieve it.

There is one important thing - **the speed of the engines has to be compared only if they achieve the same precision**. Otherwise, they could maximize the speed factors by providing inaccurate results, which everybody would rather avoid. Thus, our benchmark results are compared only at a specific search precision threshold.

We currently have planned measurements in several scenarios, from the most standard - single node deployment to a distributed cluster.


## How we select hardware?

In our experiments, we are not focusing on the absolute values of the metrics but rather on a relative comparison of different engines.
What is important is the fact we used the same machine for all the tests.
It was just wiped off between launching different engines. 

We selected an average machine, which you can easily rent from almost any cloud provider. No extra quota or custom configuration is required.


## Why you are not comparing with FAISS or Annoy?

Libraries like FAISS provide a great tool to do experiments with vector search. But they are far away from real usage in production environments.
If you are using FAISS in production, in the best case, you never need to update it in real-time. In the worst case, you have to create your custom wrapper around it to support CRUD, high availability, horizontal scalability, concurrent access, and so on.

Some vector search engines even use FAISS under the hood, but the search engine is much more than just an indexing algorithm.

We do, however, use the same benchmark datasets as the famous [ann-benchmarks project](https://github.com/erikbern/ann-benchmarks), so you can align your expectations for any practical reasons. 


## Why are you using Python client?

There is no consensus in the world of vector databases when it comes to the best technology to implement such a tool.
You’re free to choose Go, Java or Rust-based systems. 
But you’re most likely to generate your embeddings using Python with PyTorch or TensorFlow, as according to stats it is the most commonly used language for Deep Learning.
Thus, you’re probably going to use Python to put the created vectors in the database of your choice either way.
For that reason, using Go, Java or Rust clients will rarely happen in the typical pipeline - although, we encourage you to adopt Rust stack if you care about the performance of your application.
Python clients are also the most popular clients among all the engines, just by looking at the number of GitHub stars.


## What about closed-source SaaS platforms?

There are some vector databases available as SaaS only so that we couldn’t test them on the same machine as the rest of the systems.
That makes the comparison unfair. That’s why we purely focused on testing the Open Source vector databases, so everybody may reproduce the benchmarks easily.

This is not the final list, and we’ll continue benchmarking as many different engines as possible.
Some applications do not support the full list of features needed for any particular benchmark, in which case we will exclude them from the list.


## How to reproduce the benchmark?

The source code is available on [Github](https://github.com/qdrant/vector-db-benchmark) and has a README file describing the process of running the benchmark for a specific engine.

## How to contribute?

We made the benchmark Open Source because we believe that it has to be transparent. We could have misconfigured one of the engines or just done it inefficiently. If you feel like you could help us out, check out the [benchmark repository](https://github.com/qdrant/vector-db-benchmark).
