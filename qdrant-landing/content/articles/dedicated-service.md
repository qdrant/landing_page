---
title: "Vector Search as a dedicated service"
short_description: "Some arguments on why vector search requires to be a dedicated service"
description: "Some arguments on why vector search requires to be a dedicated service"
social_preview_image: /articles_data/dedicated-service/preview/social_preview.jpg
small_preview_image: /articles_data/dedicated-service/preview/lightning.svg
preview_dir: /articles_data/dedicated-service/preview
weight: -70
author: Andrey Vasnetsov
author_link: https://vasnetsov.com/
date: 2023-10-01T10:00:00+03:00
draft: false
keywords:
    - system architecture
    - vector search
    - best practices
    - anti-patterns
---


Ever since the general public discovered that vector search significantly improves LLM answers,
various vendors and enthusiasts have been arguing over where to properly store embeddings.

Some says, that it's better to store them in a specialized search engines(aka vector database), others say that it's enough to use plugins for existing databases.

Here are [just](https://nextword.substack.com/p/vector-database-is-not-a-separate) a [few](https://stackoverflow.blog/2023/09/20/do-you-need-a-specialized-vector-database-to-implement-vector-search-well/) of [them](https://www.singlestore.com/blog/why-your-vector-database-should-not-be-a-vector-database/).


In this article, we are going to present our vision and arguments on the topic.
We will try to explain why and when you acutally need a dedicated solution, debunk some ungrounded claims and anti-patterns that you should avoid while building a vector search system.

We will analyze those theses of the Universal-Database-For-Everything advocates and discuss some of the best practices we recommend to adopt in real production-grade systems. 

A table of contents:

* *Each database vector will sooner or later introduce vector capabilities...* [[click](#each-database-vector-will-sooner-or-later-introduce-vector-capabilities-that-will-make-every-database-a-vector-database)]
* *Having a dedicated vector database requires duplication of data.* [[click](#having-a-dedicated-vector-database-requires-duplication-of-data)]
* *Having a dedicated vector database requires complex data synchronization.* [[click](#having-a-dedicated-vector-database-requires-complex-data-synchronization)]
* *You have to pay for their uptime and data transfer.* [[click](#you-have-to-pay-for-their-uptime-and-data-transfer-of-both-solution)]
* *What is more seamless than your current database adding vector search capability?* [[click](#what-is-more-seamless-than-your-current-database-adding-vector-search-capability)]
* *Databases can support RAG use-case end-to-end.* [[click](#databases-can-support-rag-use-case-end-to-end)]


## Responding to claims

###### Each database vector will sooner or later introduce vector capabilities. That will make every database a Vector Database.


The origins of this misconception lie in the careless use of the term Vector *Database*.
When we think of a *database*, we subconsciously envision a relational database like Postgres or MySQL.
Or more scientifically, a service built on ACID principles, that procivides transactions, strong consistency guarantees and atomicity.

Majority of Vector Database are not *databases* in this sense.
It would be more accurate to call them *search engines*, but unfortunately, the marketing term *database* is already stuck and it is unlikely to change.


*What makes search engines different different and why vector DBs are built as search engines?*

First of all, search engines assume different patterns of workloads and priorities different properties of the system. The core architecture of such solutions is built around those priorities.

What types of properties do search engines prioritize?

* **Scalability**. Search engines are built to handle large amounts of data and queries. They are designed to be horizontally scalable and operate with more data than can fit into a single machine.
* **Search speed**. Search engines should guarantee low latency for queries, while atomicity of updates are less important.
* **Availability**. Search engines must stay available if majority of the nodes in cluster are down. At the same time they can tolerate eventual consistency of updates.

Those priorities lead to different architectural decisions, that are not reproducible in a general-purpose database, even if it has vector index support.


###### Having a dedicated vector database requires duplication of data.

The nature of vector embeddings suggests that they are not the primary source of information about the object.
In the vast majority of cases, embeddings are derived from some other data, such as text, images, or other information stored in your system. So, in fact, all embeddings you have in your system can be considered as transformations of some original source.

And the distinguishing feature of derivative data is that it will change when the transformation pipeline changes. 
In case of vector embeddings, the scenario of those changes is quite simple: every time you update the encoder model, all the embeddings will change.

In systems, where vector embeddings are fused with the primary data source, it is impossible to perform such migrations without significantly affecting the production system.

As a result, even if you want to use a single database for storing all kinds of data, you would still need to duplicate data internally.

###### Having a dedicated vector database requires complex data synchronization.

Most production systems prefer to isolate different types of workloads into separate services.
In many cases, those isolated services are not even related to search use-cases.

For example, database for analytics and for serving can be updated from the same source, but store data in a different ways in accordance with their typical workloads.

Search engines are usually isolated for the same reason, you don't want to create a noisy neighbor problem and compromise the performance of your main database.

*To give you some intuition, let's consider a practical example:*

Assume we have a database with 1 million records.
This is a small database by modern standards of any relational database.
You can probably use the smallest free tier of any cloud provider to host it.

But if we want to use this database for vector search, 1 million OpenAI `text-embedding-ada-002` embeddings will take ~6Gb of RAM (sic!).
As you can see, the vector search use-case completely overwhelmed the main database resource requirements.
In practice it means, that you will no longer be able to scale your main database efficiently, and be limited by the size of single machine.

Fortunately, the problem of data synchronization is not new and definitely not unique to vector search.
There are many well-known solutions, starting with message queues and ending with specialized ETL tools.

For example, just recently we have released our [integration with Airbyte](/documentation/integrations/airbyte/), which allows you to incrementally synchronize data from various sources to Qdrant.

###### You have to pay for their uptime and data transfer. Of both solution.

In the open-source world, you pay for resources you use, not the number of different databases you run.
And resources depends more on how optimal solution for each use-case is.
As a result, running a dedicated vector search engine might be even cheaper, as it allies optimization specifically for vector search use-cases.

For instance, Qdrant implements a number of [quantization techniques](documentation/guides/quantization/), that can significantly reduce the memory footprint of embeddings.

Not to mention, that data transfer costs within the same region are usually free in majority of cloud providers.


###### What is more seamless than your current database adding vector search capability?


In contrast to the short-term attractiveness of the integrate solutions, dedicated search engines proposes flexibility and modular approach.
You don't need to update the whole production database each time some of the vector plugins are updated.
Maintenance of a dedicated search engine is as much isolated from the main database as the data itself.

It is especially important in the large enterprise organizations, where the responsibility for different parts of the system is distributed among different teams.
In those situations, it is much easier to maintain a dedicated search engine for the AI team, than to convince the core team to update the whole primary database.

Additionally, you won't depend on sluggish development cycles of huge integrated products, which have to consider legacy support and backward compatibility for all their features.


###### Databases can support RAG use-case end-to-end.

Putting aside the questions of performance and scalability, the whole discussion about implementing RAG in the DBs assumes, that there is only detail missing in traditional databases is vector index and ability to make fast ANN queries.

In fact, we believe, that capabilities of vector search have only started to unwrap.
For example in our recent article we discuss a possibility to build an [exploration API](/articles/vector-similarity-beyond-search/) to fuel the discovery process - an alternative to kNN search, where you don’t know what exactly are you looking for.


## Summary

Large-scale production systems are usually consist of many different specialized services for a good reason.
We discussed those of them, that are related to vector search use-cases in this article, but there are many more.

Scaling even simplest systems unlocks a whole new level of challenges with each order of magnitude, and that is especially true for vector search.
Having control and flexibility over each part of the system is crucial for controlling those challenges and hence the cost of the system.