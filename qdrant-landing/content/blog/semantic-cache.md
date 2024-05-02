---
title: "Semantic Cache"
draft: false
slug:  
short_description: "Semantic Cache for Best Results and Optimization."
description: "Implementing Semantic . " 
preview_image: /blog/semantic-cache/social_preview.png
social_preview_image: /blog/semantic-cache/social_preview.png
date: 2024-05-01T00:00:00-08:00
author: Daniel Romero, David Myriel
featured: false 
tags:
  - vector search
  - semantic cache
---

## What is a Semantic Cache?

In computing, a **cache** is a high-speed memory that efficiently stores frequently accessed data. In the context of vector databases, a **semantic cache** improves AI application performance by storing previously retrieved results along with the conditions under which they were computed. This allows the application to reuse those results when the same or similar conditions occur again, rather than finding them from scratch.

> The term **"semantic"** implies that the cache takes into account the meaning or semantics of the data or computation being cached, rather than just its syntactic representation. This can lead to more efficient caching strategies that exploit the structure or relationships within the data or computation.

Traditional caches operate on an exact match basis, while semantic caches search for the meaning of the key rather than an exact match. For example, **"What is the capital of the USA?"** and **"Tell me the name of the capital of The USA"** are semantically equivalent, but not exact matches. A semantic cache recognizes such semantic equivalence and provides the correct result. In this blog, we will walk you through how to use Qdrant to implement a basic semantic cache system. 

#### Uses in Retrieval-Augmented Generation (RAG)

Semantic cache is increasingly used in Retrieval-Augmented Generation (RAG) applications. In RAG, when a user asks a question, we embed it and search our vector database, either by using keyword, semantic, or hybrid search methods. The matched context is then passed to a Language Model (LLM) along with the prompt and user question for response generation.

**Figure 1:** Semantic Cache architecture in a Retrieval-Augmented Generation (RAG) scenario

![rag-semantic-cache](/blog/semantic-cache/rag-semantic-cache.png)

This process can be computationally intensive, especially for frequently asked questions. Implementing a cache component can mitigate this. For instance, if a user repeats a question, like **"What is the capital of the USA?"**, the system can retrieve the precomputed answer from the cache rather than re-executing the entire process. This cache stores questions as keys and their corresponding answers as values, providing an efficient means to handle repeated queries.

#### Accounting for Phrasing Variations

When using a key-value cache, it's important to consider that slight variations in question wording can lead to different hash values. The two questions in the above example convey the same query but differ in wording. A naive cache search might fail due to distinct hashed versions of the questions. Implementing a more nuanced approach is necessary to accommodate phrasing variations and ensure accurate responses.

To address this challenge, a semantic cache can be employed instead of relying solely on exact matches. This entails storing questions, answers, and their embeddings in a key-value structure. When a user poses a question, a semantic search is conducted across all cached questions to identify the most similar one. If the similarity score surpasses a predefined threshold, the system assumes equivalence between the user's question and the matched one, providing the corresponding answer accordingly.

#### When to Use Semantic Caching

Using a semantic cache eliminates the need for repeated searches and generation processes for similar or duplicate questions, thus saving time and money, especially when employing costly language model calls like OpenAI's.

> For applications like question-answering systems where facts are retrieved from documents, caching is beneficial due to the consistent nature of the queries. *However, for text generation tasks requiring varied responses, caching may not be ideal as it returns previous responses, potentially limiting variation.* Thus, the decision to use caching depends on the specific use case.

Using a cache might not be ideal for applications where diverse responses are desired across multiple queries. However, in question-answering systems, caching is advantageous since variations are insignificant. It serves as an effective performance optimization tool for chatbots by storing frequently accessed data. One strategy involves creating ad-hoc patches for chatbot dialogues, where commonly asked questions are pre-mapped to prepared responses in the cache. This allows the chatbot to swiftly retrieve and deliver responses without relying on a Language Model (LLM) for each query.



