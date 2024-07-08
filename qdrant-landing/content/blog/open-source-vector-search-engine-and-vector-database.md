---
draft: false
title: Optimizing an Open Source Vector Database with Andrey Vasnetsov
slug: open-source-vector-search-engine-vector-database
short_description: CTO of Qdrant Andrey talks about Vector search engines and
  the technical facets and challenges encountered in developing an open-source
  vector database.
description: Learn key strategies for optimizing vector search from Andrey Vasnetsov, CTO at Qdrant. Dive into techniques like efficient indexing for improved performance.
preview_image: /blog/from_cms/andrey-vasnetsov-cropped.png
date: 2024-01-10T16:04:57.804Z
author: Demetrios Brinkmann
featured: false
tags:
  - Qdrant
  - Vector Search Engine
  - Vector Database
---

# Optimizing Open Source Vector Search: Strategies from Andrey Vasnetsov at Qdrant

> *"For systems like Qdrant, scalability and performance in my opinion, is much more important than transactional consistency, so it should be treated as a search engine rather than database."*\
-- Andrey Vasnetsov
> 

Discussing core differences between search engines and databases, Andrey underlined the importance of application needs and scalability in database selection for vector search tasks.

Andrey Vasnetsov, CTO at Qdrant is an enthusiast of [Open Source](https://qdrant.tech/), machine learning, and vector search. He works on Open Source projects related to [Vector Similarity Search](https://qdrant.tech/articles/vector-similarity-beyond-search/) and Similarity Learning. He prefers practical over theoretical, working demo over arXiv paper.

***You can watch this episode on [YouTube](https://www.youtube.com/watch?v=bU38Ovdh3NY).***

<iframe width="560" height="315" src="https://www.youtube.com/embed/bU38Ovdh3NY?si=GiRluTu_c-4jESMj" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

***This episode is part of the [ML⇄DB Seminar Series](https://db.cs.cmu.edu/seminar2023/#) (Machine Learning for Databases + Databases for Machine Learning) of the Carnegie Mellon University Database Research Group.***

## **Top Takeaways:**

Dive into the intricacies of [vector databases](https://qdrant.tech/articles/what-is-a-vector-database/) with Andrey as he unpacks Qdrant's approach to combining filtering and vector search, revealing how in-place filtering during graph traversal optimizes precision without sacrificing search exactness, even when scaling to billions of vectors.

5 key insights you’ll learn:

- 🧠 **The Strategy of Subgraphs:** Dive into how overlapping intervals and geo hash regions can enhance the precision and connectivity within vector search indices.

- 🛠️ **Engine vs Database:** Discover the differences between search engines and relational databases and why considering your application's needs is crucial for scalability.

- 🌐 **Combining Searches with Relational Data:** Get insights on integrating relational and vector search for improved efficiency and performance.

- 🚅 **Speed and Precision Tactics:** Uncover the techniques for controlling search precision and speed by tweaking the beam size in HNSW indices.

- 🔗 **Connected Graph Challenges:** Learn about navigating the difficulties of maintaining a connected graph while filtering during search operations.

> Fun Fact: [The Qdrant system](https://qdrant.tech/) is capable of in-place filtering during graph traversal, which is a novel approach compared to traditional post-filtering methods, ensuring the correct quantity of results that meet the filtering conditions.
> 

## Timestamps:

00:00 Search professional with expertise in vectors and engines.\
09:59 Elasticsearch: scalable, weak consistency, prefer vector search.\
12:53 Optimize data structures for faster processing efficiency.\
21:41 Vector indexes require special treatment, like HNSW's proximity graph and greedy search.\
23:16 HNSW index: approximate, precision control, CPU intensive.\
30:06 Post-filtering inefficient, prefiltering costly.\
34:01 Metadata-based filters; creating additional connecting links.\
41:41 Vector dimension impacts comparison speed, indexing complexity high.\
46:53 Overlapping intervals and subgraphs for precision.\
53:18 Postgres limits scalability, additional indexing engines provide faster queries.\
59:55 Embedding models for time series data explained.\
01:02:01 Cheaper system for serving billion vectors.

## More Quotes from Andrey:

*"It allows us to compress vector to a level where a single dimension is represented by just a single bit, which gives total of 32 times compression for the vector."*\
-- Andrey Vasnetsov on vector compression in AI

*"We build overlapping intervals and we build these subgraphs with additional links for those intervals. And also we can do the same with, let's say, location data where we have geocoordinates, so latitude, longitude, we encode it into geo hashes and basically build this additional graph for overlapping geo hash regions."*\
-- Andrey Vasnetsov

*"We can further compress data using such techniques as delta encoding, as variable byte encoding, and so on. And this total effect, total combined effect of this optimization can make immutable data structures order of minute more efficient than mutable ones."*\
-- Andrey Vasnetsov
