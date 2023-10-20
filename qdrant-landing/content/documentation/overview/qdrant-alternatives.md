---
title: Qdrant vs. Alternatives
weight: 2
---

# Comparing Qdrant with alternatives

If you are currently using other vector databases, we recommend you read this short guide. It breaks down the key differences between Qdrant and other similar products. This document should help you decide which product has the features and support you need. 
Unfortunately, since Pinecone is not an open source product, we can't include it in our [benchmarks](/benchmarks/). However, we still recommend you use the [benchmark tool](/benchmarks/) while exploring Qdrant. 

## Feature comparison

| Feature                             | Pinecone                      | Qdrant                                       | Comments                                                 |
|-------------------------------------|-------------------------------|----------------------------------------------|----------------------------------------------------------|
| **Deployment Modes**                | SaaS-only                     | Local, on-premise, Cloud                     | Qdrant offers more flexibility in deployment modes       |
| **Supported Technologies**          | Python, JavaScript/TypeScript | Python, JavaScript/TypeScript, Rust, Go      | Qdrant supports a broader range of programming languages |
| **Performance** (e.g., query speed) | TnC Prohibit Benchmarking     | [Benchmark result](/benchmarks/)             | Compare performance metrics                              |
| **Pricing**                         | Starts at $70/mo              | Free and Open Source, Cloud starts at $25/mo | Pricing as of May 2023                                   |

## Prototyping options

Qdrant offers multiple ways of deployment, including local mode, on-premise, and [Qdrant Cloud](https://cloud.qdrant.io/). 
You can [get started with local mode quickly](/documentation/quick-start/) and without signing up for SaaS. With Pinecone you will have to connect your development environment to the cloud service just to test the product. 

When it comes to SaaS, both Pinecone and [Qdrant Cloud](https://cloud.qdrant.io/) offer a free cloud tier to check out the services, and you don't have to give credit card details for either. Qdrant's free tier should be enough to keep around 1M of 768-dimensional vectors, but it may vary depending on the additional attributes stored with vectors. Pinecone's starter plan supports approximately 200k 768-dimensional embeddings and metadata, stored within a single index. With Qdrant Cloud, however, you can experiment with different models as you may create several collections or keep multiple vectors per each point. That means Qdrant Cloud allows you building several small demos, even on a free tier.

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

## Planning to migrate?

> We strongly recommend you use [Qdrant Tools](https://github.com/NirantK/qdrant_tools) to migrate from Qdrant to Pinecone.

Migrating from Pinecone to Qdrant involves a series of well-planned steps to ensure that the transition is smooth and disruption-free. Here is a suggested migration plan:

1. Understanding Qdrant: It's important to first get a solid grasp of Qdrant, its functions, and its APIs. Take time to understand how to establish collections, add points, and query these collections.

2. Migration strategy: Create a comprehensive migration strategy, incorporating data migration (copying your vectors and associated metadata from Pinecone to Qdrant), feature migration (verifying the availability and setting up of features currently in use with Pinecone in Qdrant), and a contingency plan (should there be any unexpected issues).

3. Establishing a parallel Qdrant system: Set up a Qdrant system to run concurrently with your current Pinecone system. This step will let you begin testing Qdrant without disturbing your ongoing operations on Pinecone.

4. Data migration: Shift your vectors and metadata from Pinecone to Qdrant. The timeline for this step could vary, depending on the size of your data and Pinecone API's rate limitations.

5. Testing and transition: Following the data migration, thoroughly test the Qdrant system. Once you're assured of the Qdrant system's stability and performance, you can make the switch.

6. Monitoring and fine-tuning: After transitioning to Qdrant, maintain a close watch on its performance. It's key to continue refining the system for optimal results as needed.

## Next steps

1. If you aren't ready yet, [try out Qdrant locally](/documentation/quick-start/) or sign up for [Qdrant Cloud](https://cloud.qdrant.io/).

2. For more basic information on Qdrant read our [Overview](overview/) section or learn more about Qdrant Cloud's [Free Tier](documentation/cloud/).

3. If ready to migrate, please consult our [Comprehensive Guide](https://github.com/NirantK/qdrant_tools) for further details on migration steps.
