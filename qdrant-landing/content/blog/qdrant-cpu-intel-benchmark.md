---
title: "Intel’s New CPU Powers Faster Vector Search"
draft: false
slug: qdrant-cpu-intel-benchmark
short_description: "New generation silicon is a game-changer for AI/ML applications."
description: "Intel’s 5th gen Xeon processor is made for enterprise-scale operations in vector space. " 
preview_image: /blog/qdrant-cpu-intel-benchmark/social_preview.jpg
social_preview_image: /blog/qdrant-cpu-intel-benchmark/social_preview.jpg
date: 2024-05-10T00:00:00-08:00
author: David Myriel, Kumar Shivendu
featured: false 
tags:
  - vector search
  - intel benchmark
  - next gen cpu
  - vector database
---

#### New generation silicon is a game-changer for AI/ML applications
![qdrant cpu intel benchmark report](/blog/qdrant-cpu-intel-benchmark/qdrant-cpu-intel-benchmark.png)

> *Intel’s 5th gen Xeon processor is made for enterprise-scale operations in vector space.*

Vector search is surging in popularity with institutional customers, and Intel is ready to support the emerging industry. Their latest generation CPU performed exceptionally with Qdrant, a leading vector database used for enterprise AI applications.

Intel just released the latest Xeon processor (**codename: Emerald Rapids**) for data centers, a market which is expected to grow to $45 billion. Emerald Rapids offers higher-performance computing and significant energy efficiency over previous generations. Compared to the 4th generation Sapphire Rapids, Emerald boosts AI inference performance by up to 42% and makes vector search 38% faster.

## The CPU of choice for vector database operations

The latest generation CPU performed exceptionally in tests carried out by Qdrant’s R&D division. Intel’s CPU was stress-tested for query speed, database latency and vector upload time against massive-scale datasets. Results showed that machines with 32 cores were 1.38x faster at running queries than their previous generation counterparts. In this range, Qdrant’s latency also dropped 2.79x when compared to Sapphire.

Qdrant strongly recommends the use of Intel’s next-gen chips in the 8-64 core range. In addition to being a practical number of cores for most machines in the cloud, this compute capacity will yield the best results with mass-market use cases.

The CPU affects vector search by influencing the speed and efficiency of mathematical computations. As of recently, companies have started using GPUs to carry large workloads in AI model training and inference. However, for vector search purposes, studies show that CPU architecture is a great fit because it can handle concurrent requests with great ease.

> *“Vector search is optimized for CPUs. Intel’s new CPU brings even more performance improvement and makes vector operations blazing fast for AI applications. Customers should consider deploying more CPUs instead of GPU compute power to achieve best performance results and reduce costs simultaneously.”* 
> 
> - André Zayarni, Qdrant CEO

## **Why does vector search matter?**

![qdrant cpu intel benchmark report](/blog/qdrant-cpu-intel-benchmark/qdrant-cpu-intel-benchmark-future.png)

Vector search engines empower AI to look deeper into stored data and retrieve strong relevant responses.

Qdrant’s vector database is key to modern information retrieval and machine learning systems. Those looking to run massive-scale Retrieval Augmented Generation (RAG) solutions need to leverage such semantic search engines in order to generate the best results with their AI products.

Qdrant is purpose-built to enable developers to store and search for high-dimensional vectors efficiently. It easily integrates with a host of AI/ML tools: Large Language Models (LLM), frameworks such as LangChain, LlamaIndex or Haystack, and service providers like Cohere, OpenAI, and Ollama.

## Supporting enterprise-scale AI/ML

The market is preparing for a host of artificial intelligence and machine learning cases, pushing compute to the forefront of the innovation race.

The main strength of a vector database like Qdrant is that it can consistently support the user way past the prototyping and launch phases. Qdrant’s product is already being used by large enterprises with billions of data points. Such users can go from testing to production almost instantly. Those looking to host large applications might only need up to 18GB RAM to support 1 million OpenAI Vectors. This makes Qdrant the best option for maximizing resource usage and data connection.

Intel’s latest development is crucial to the future of vector databases. Vector search operations are very CPU-intensive. Therefore, Qdrant relies on the innovations made by chip makers like Intel to offer large-scale support.

> *“Vector databases are a mainstay in today’s AI/ML toolchain, powering the latest generation of RAG and other Gen AI Applications. In teaming with Qdrant, Intel is helping enterprises deliver cutting-edge Gen-AI solutions and maximize their ROI by leveraging Qdrant’s high-performant and cost-efficient vector similarity search capabilities running on latest Intel Architecture based infrastructure across deployment models.”* 
> 
> - Arijit Bandyopadhyay, CTO - Enterprise Analytics & AI, Head of Strategy – Cloud and Enterprise, CSV Group, Intel Corporation

## Advancing vector search and the role of next-gen CPUs

Looking ahead, the vector database market is on the cusp of significant growth, particularly for the enterprise market. Developments in CPU technologies, such as those from Intel, are expected to enhance vector search operations by 1) improving processing speeds and 2) boosting retrieval efficiency and quality. This will allow enterprise users to easily manage large and more complex datasets and introduce AI on a global scale.

As large companies continue to integrate sophisticated AI and machine learning tools, the reliance on robust vector databases is going to increase. This evolution in the market underscores the importance of continuous hardware innovation in meeting the expanding demands of data-intensive applications, with Intel's contributions playing a notable role in shaping the future of enterprise-scale AI/ML solutions.

## Next steps

Qdrant is open source and offers a complete SaaS solution, hosted on AWS, GCP, and Azure.

Getting started is easy, either spin up a [container image](https://hub.docker.com/r/qdrant/qdrant) or start a [free Cloud instance](https://cloud.qdrant.io/login). The documentation covers [adding the data](/documentation/tutorials/bulk-upload/) to your Qdrant instance as well as [creating your indices](/documentation/tutorials/optimize/). We would love to hear about what you are building and please connect with our engineering team on [Github](https://github.com/qdrant/qdrant), [Discord](https://discord.com/invite/tdtYvXjC4h), or [LinkedIn](https://www.linkedin.com/company/qdrant).