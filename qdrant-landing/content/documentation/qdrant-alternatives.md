---
title: Qdrant vs. Alternatives
weight: 10
draft: true
---

# Comparing Alternatives: Qdrant vs. Pinecone

Qdrant might just be the right vector search engine for you - but before you even consider switching: every transition has its challenges, primarily understanding new terminologies and concepts. 
That's where this guide comes in. It succinctly breaks down the key differences between Qdrant and other vector databases and engines, paving the way for a smoother, more informed transition:

| Feature                         | Pinecone                      | Qdrant                                       | Comments                                                 |
|---------------------------------|-------------------------------|----------------------------------------------|----------------------------------------------------------|
| Deployment Modes                | SaaS-only                     | Local, on-premise, Cloud                     | Qdrant offers more flexibility in deployment modes       |
| Supported Technologies          | Python, JavaScript/TypeScript | Python, JavaScript/TypeScript, Rust, Go      | Qdrant supports a broader range of programming languages |
| Performance (e.g., query speed) | TnC Prohibit Benchmarking     | [Benchmark result](/benchmarks/)             | Compare performance metrics                              |
| Pricing                         | Starts at $70/mo              | Free and Open Source, Cloud starts at $25/mo | Pricing as on May 2023                                   |

## Pinecone Overview

Pinecone is a SaaS-only vector database written in Rust. Since it's not Open Source, we couldn't include it in our 
[benchmarks](/benchmarks/), but that's a popular tool among the users who decide to switch to Qdrant. 

## Deployment modes

While Qdrant offers multiple ways of deployment, including local mode, on-premise, and [Qdrant Cloud](https://cloud.qdrant.io/), 
Pinecone is available in a SaaS-only model. Thus, even your development environment has to connect with the cloud services,
while Qdrant offers you some local modes as well.

## Terminology

Although both tools serve similar purposes, there are some differences in the terms used. This dictionary may come 
in handy during the transition.

| Pinecone       | Qdrant         | Comments                                                                                                                                                                                                                                                                       |
|----------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Index**      | **Collection** | Pinecone's index is an organizational unit for storing and managing vectors of the same size. The index is tightly coupled with hardware (pods). Qdrant uses the collection to describe a similar concept, however, a single instance may handle multiple collections at once. |
| **Collection** | N/A            | A collection in Pinecone is a static copy of an *index* that you cannot query, mostly used as some sort of backup. There is no such concept in Qdrant, but if you want to back your collection up, you may always create a snapshot.                                           |
| **Namespace**  | N/A            | Namespaces allow the partitioning of the vectors in an index into subsets. Qdrant does not have such a concept, as you can always create multiple collections.                                                                                                                 |
| **Metadata**   | **Payload**    | Additional attributes describing a particular object, other than the embedding vector. Both engines support various data types, but Pinecone metadata is key-value, while Qdrant supports any JSON-like objects.                                                               |
| **Query**      | **Search**     | Name of the method used to find the nearest neighbors for a given vector, possibly with some additional filters applied on top.                                                                                                                                                |
| N/A            | **Scroll**     | Pinecone does not offer a way to iterate through all the vectors in a particular index. Qdrant has a `scroll` method to get them all without using search.                                                                                                                     |

## Known limitations

1. Pinecone does not support arbitrary JSON metadata, but a flat structure with strings, numbers, booleans, or lists of strings used as values. Qdrant accepts any JSON object as a payload, even nested structures.
2. NULL values are not supported in Pinecone metadata but are handled properly by Qdrant.
3. The maximum size of Pinecone metadata is 40kb per vector. 
4. Pinecone, unlike Qdrant, does not support geolocation and filtering based on geographical criteria.
5. Qdrant allows storing multiple vectors per point, and those might be of a different dimensionality. Pinecone doesn't support anything similar.
6. Vectors in Pinecone are mandatory for each point. Qdrant supports optional vectors.

It is worth mentioning, that **Pinecone will automatically create metadata indexes for all the fields**. Qdrant assumes you know
your data and your future queries best, so it's up to you to choose the fields to be indexed. Thus, **you need to explicitly define the payload indexes while using Qdrant**.

## Supported technologies

Both tools support various programming languages providing official SDKs.

|                           | Pinecone             | Qdrant               |
|---------------------------|----------------------|----------------------|
| **Python**                | ✅                    | ✅                    |
| **JavaScript/TypeScript** | ✅                    | ✅                    |
| **Rust**                  | ❌                    | ✅                    |
| **Go**                    | ❌                    | ✅                    |

There are also various community-driven projects aimed to provide the support for the other languages, but those are not officially 
maintained, thus not mentioned here. However, it is still possible to interact with both engines through the HTTP REST or gRPC API. 
That makes it easy to integrate with any technology of your choice.

If you are a Python user, then both tools are well-integrated with the most popular libraries like [LangChain](../integrations/langchain/), [LlamaIndex](../integrations/llama-index/), [Haystack](../integrations/haystack/), and more. 
Using any of those libraries makes it easier to experiment with different vector databases, as the transition should be seamless.

## Comparison to Qdrant Cloud

Both Pinecone and Qdrant Cloud offer a free cloud tier to check out the services, even without providing credit card details.
Each free tier should be enough to keep around 1M of 768-dimensional vectors, but it may vary depending on the additional attributes 
stored with vectors. With Qdrant Cloud, however, you can experiment with different models as you may create several collections 
or keep multiple vectors per each point. That means Qdrant Cloud allows you building several small demos, even on a free tier.
