---
draft: false
id: 4
title: Single node filtered search benchmark
description: We proceeded our benchmarks and this time measured how most popular open-source search engines perform filtered search. We chose the same configuration for each engine and tested them on different datasets. These datasets include both synthetic and real-world data with various filters from exact match to presence in geo area or float range.

date: 2023-02-13
weight: 3
---

### Why did we decide to make this benchmark?

Filtered search is everywhere, you can think of use cases for it in a matter of seconds.
Despite importance of filtered search, not every vector search engine fully supports it.
A lot of pitfalls can be encountered on a way to a proper implementation.
We want to evaluate what engines can offer today.

### What data do we use?

We use both synthetic and real world data.
Synthetic data was used to reproduce isolated environment with certain conditions.
Real data was used to measure the performance of engines on data close to the production.
