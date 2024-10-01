---
draft: false
title: "How Sprinklr Leveraged Qdrant to Build a GenAI Platform for Customer Experience Management"
short_description: "Using vector search to power AI-driven tools for customer engagement."
description: "Learn how Sprinklr uses vector search to power AI-driven tools for customer engagement, improving speed, cost-efficiency, and scalability"
preview_image: /blog/case-study-sprinklr/preview.png
social_preview_image: /blog/case-study-sprinklr/preview.png
date: 2024-09-26T00:02:00Z
author: Qdrant
featured: false
tags:
  - Sprinklr
  - Vector Search
---

![case-study-shakudo-1](/blog/case-study-sprinklr/image5.png)

[Sprinklr](https://www.sprinklr.com/), a leader in customer experience management, relies on cutting-edge technology to help global brands engage customers meaningfully across every channel. To achieve this, Sprinklr needed a robust platform that could support their AI-driven tools, particularly in handling the vast data requirements of customer interactions.

Raghav Sonavane, Associate Director of Machine Learning Engineering at Sprinklr, leads the Applied AI team, focusing on Generative AI (GenAI) and Retrieval-Augmented Generation (RAG). His team is responsible for training and fine-tuning in-house models and deploying advanced retrieval and generation systems for customer-facing applications like FAQ bots and other [GenAI-driven services](https://www.sprinklr.com/blog/how-sprinklr-uses-RAG/). The team provides all of these capabilities in a centralized platform to the Sprinklr product engineering teams.

![case-study-shakudo-1](/blog/case-study-sprinklr/image2.png)

**Figure 1:** Sprinklr’s RAG architecture

Sprinklr’s platform is composed of four key product suites - Sprinklr Services, Sprinklr Marketing, Sprinklr Social, and Sprinklr Insights. Each suite is embedded with AI-first features such as assist agents, post-call analysis, and real-time analytics, which are crucial for managing large-scale contact center operations. “These AI-driven capabilities, powered by advanced vector search with Qdrant, enable Sprinklr’s customer-facing GenAI solutions, including FAQ bots, transactional bots, conversational services, and product recommendation engines,” says Sonavane.

These self-serve tools rely heavily on advanced vector search to analyze and optimize community content and refine knowledge bases, ensuring efficient and relevant responses. Further, for customers requiring further assistance after using these tools, Sprinklr equips support agents with powerful search capabilities, enabling them to quickly access similar cases and draw from past interactions, enhancing the quality and speed of customer support.

## The Need for a Vector Database

As an AI-first company, Sprinklr faced the challenge of unifying its diverse AI capabilities across various customer-facing applications. With multiple product teams working on solutions for customer care, service, and insights, one of the primary goals was to consolidate these AI efforts into a single platform. "The key challenge was to provide the highest quality and fastest search capabilities for retrieval tasks across the board," explains Sonavane.

Last year, Sprinklr undertook a comprehensive evaluation of its existing infrastructure. The goals were to identify current capability gaps, benchmark performance for speed and cost, and explore opportunities to improve the developer experience through enhanced scalability and stronger data privacy controls. It became clear that an advanced vector database was essential to meet these needs, and Qdrant emerged as the ideal solution.

### Why Qdrant?

After evaluating several options, including Pinecone, Weaviate, and ElasticSearch, Sprinklr chose Qdrant for its:

- **Developer-Friendly Documentation:** “Qdrant’s clear [documentation](https://qdrant.tech/documentation/) enabled our team to integrate it quickly into our workflows,” notes Sonavane.
- **High Customizability:** Qdrant provided Sprinklr with essential flexibility through high-level abstractions that allowed for extensive customizations. The diverse teams at Sprinklr, working on various GenAI applications, needed a solution that could adapt to different workloads. “The ability to fine-tune configurations at the collection level was crucial for our varied AI applications,” says Sonavane. Qdrant met this need by offering:
  - **Configuration for high-speed search** that fine-tunes settings for optimal performance.
  - [**Quantized vectors**](https://qdrant.tech/documentation/guides/quantization/) for high-dimensional data workloads
  - [**Memory map**](https://qdrant.tech/documentation/concepts/storage/#configuring-memmap-storage) for efficient search optimizing memory usage.
- **Speed and Cost Efficiency:** Qdrant provided the best combination of speed and cost, making it the most viable solution for Sprinklr’s needs. “We needed a solution that wouldn’t just meet our performance requirements but also keep costs in check, and Qdrant delivered on both fronts,” says Sonavane.
- **Enhanced Monitoring:** Qdrant’s monitoring tools further boosted system efficiency, allowing Sprinklr to maintain high performance across their platforms.

## Implementation and Qdrant’s Performance

Sprinklr’s transition to Qdrant was carefully managed, starting with 10% of their workloads before gradually scaling up. The transition was seamless, thanks in part to Qdrant’s configurable [Web UI](https://qdrant.tech/documentation/interfaces/web-ui/), which allowed Sprinklr to fully leverage the platform’s capabilities.

“Qdrant’s ability to index [multiple vectors](https://qdrant.tech/documentation/concepts/vectors/#multivectors) simultaneously and retrieve and re-rank with precision was a game-changer for us,” Sonavane remarks. This feature reduced the need for repeated retrieval processes, significantly improving efficiency. Additionally, Qdrant’s [quantization](https://qdrant.tech/documentation/guides/quantization/) and [memory mapping](https://qdrant.tech/documentation/concepts/storage/#configuring-memmap-storage) features enabled Sprinklr to reduce RAM usage, leading to substantial cost savings.

Qdrant now serves as the backbone of Sprinklr’s GenAI platform, which is designed to be cloud- and LLM-agnostic. The platform supports various AI-driven tasks, from retrieval and re-ranking to serving advanced customer experience tools. “Retrieval is the foundation of all our AI tasks, and Qdrant’s resilience and speed have made it an integral part of our system,” Sonavane emphasizes. Sprinklr operates [Qdrant as a managed service on AWS](https://qdrant.tech/cloud/), ensuring scalability, reliability, and ease of use.

### Key Outcomes with Qdrant

After rigorous internal evaluation, Sprinklr achieved the following results with Qdrant:

- **30% Cost Reduction**: Internal benchmarking showed Qdrant reduced Sprinklr's retrieval infrastructure costs by 30%.
- **Improved Developer Efficiency**: Qdrant’s user-friendly environment made it easier to maintain instances, enhancing overall efficiency.

The Sprinklr team conducted a thorough internal benchmark on applications requiring vector search across 10k to over 1M vectors with varying dimensions of vectors depending on the use case. The key results from these benchmarks include:

- **Superior Write Performance**: Qdrant's write performance excelled in Sprinklr’s benchmark tests, with incremental indexing time for 100k to 1M vectors being less than 10% of Elasticsearch’s, making it highly efficient for handling updates and append queries in high-ingestion use cases.
- **Low Latency for Real-Time Applications:** In Sprinklr's benchmark, Qdrant delivered a P99 latency of 20ms for searches on 1 million vectors, making it ideal for real-time use cases like live chat, where Elasticsearch and Milvus both exceeded 100ms.
- **High Throughput for Heavy Query Loads**: In Sprinklr's benchmark, Qdrant handled up to 250 requests per second (RPS) under similar configurations, significantly outperforming Elasticsearch's 100 RPS, making it ideal for environments with heavy query loads.

“For us Qdrant is a very fast and high quality retrieval system,” Sonavane points out.

![case-study-shakudo-1](/blog/case-study-sprinklr/image1.png)

**Figure 2:** P95 Query Time vs Mean Average Precision Benchmark Across Varying Index Sizes

## Outlook

Looking ahead, the Applied AI team at Sprinklr is focused on developing digital twins for companies, organizations, and employees, aiming to seamlessly integrate AI agents with human workers in business processes. These digital twins are powered by a process engine that incorporates personas, skills, tasks, and activities, designed to optimize operational efficiency.

![case-study-shakudo-1](/blog/case-study-sprinklr/image3.png)

**Figure 3:** Sprinklr Digital Twin

Vector search will play a crucial role, as each AI agent will have its own knowledge base, skill set, and tool set, enabling precise and autonomous task execution. The integration of Qdrant further enhances the system's ability to manage and utilize large volumes of data effectively.
