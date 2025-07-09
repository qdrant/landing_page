---
title: "Qdrant 1.15.0 - Smarter Quantization, Healing Indexes, and Multilingual Text Filtering"
draft: false
slug: qdrant-1.15.x 
short_description: "Smarter Quantization, Healing Indexes, and Multilingual Text Filtering"
description: "New access control options for RBAC, a much faster shard transfer procedure, and direct support for byte embeddings. " 
preview_image: /blog/qdrant-1.15.x/social_preview.png
social_preview_image: /blog/qdrant-1.15.x/social_preview.png
date: 2025-07-08T00:00:00-08:00
author: Derrick Mwiti
featured: false 
tags:
  - vector search
  - quantization
  - new features
---
# Qdrant 1.15 - Smarter Quantization, Healing Indexes, and Multilingual Text Filtering

Qdrant 1.15.0 is out! Let’s look at the main features for this version: 

**New quantizations:** Asymmetric quantization allows vectors and queries to have different quantization algorithms - new 1.5 and 2-bit quantizations for improved accuracy. 

**HNSW healing**: Allows HNSW indexes to reuse the old graph even if some vectors are updated or deleted, improving resource utilization during frequent index updates. 

**Changes in text index**: Introduction of a new multilingual tokenizer, including stopwords, a stemmer, and phrase matching. 

## **New Quantization Modes**

We are expanding the Qdrant quantization toolkit with: 

* **1.5-bit and 2-bit quantization** for better tradeoffs between compression and accuracy.   
* **Asymmetric quantization** to combine binary storage with scalar queries for smarter memory use. 

We introduce a new **binary quantization** storage that uses **2 and 1.5 bits** per dimension, improving precision for smaller vectors. Previous one-bit compression resulted in significant data loss and precision drops for vectors smaller than a thousand dimensions, often requiring expensive rescoring. 2-bit quantization offers 16X compression compared to 32X with one bit, improving performance for smaller vector dimensions. The 1.5-bit quantization compression offers 24X compression and intermediate accuracy. 

Asymmetric quantization enhances accuracy while maintaining binary quantization's storage benefits. In **asymmetric quantization** the queries use a different algorithm, specifically scalar quantization. This approach maintains storage size and RAM usage similar to binary quantization while offering improved precision. It is beneficial for memory-constrained deployments, or the bottleneck is disk I/O rather than CPU. This is particularly useful for indexing millions of vectors as it improves precision without sacrificing much because the limitation in such scenarios is disk speed, not CPU. This approach requires less rescoring for the same quality output. 

## **Changes in Text Index**

In 1.15, we have added:

* Multilingual tokenizer support  
* Stopword filtering   
* Stemming support   
* [Phrase matching](https://qdrant.tech/documentation/concepts/filtering/#phrase-match) 

With [phrase matching](https://qdrant.tech/documentation/concepts/filtering/#phrase-match), you can now perform exact phrase comparisons, allowing you to search for a specific phrase within a text field.  For example, the phrase “machine time” will be matched exactly in that order within the “summary” field:

```python
models.FieldCondition(
    key="summary",
    match=models.MatchPhrase(text="machine time"),
)
```
The above will match:

|  | text |
| -- | --
| ✅ | "The **machine time** is local, rather than global in distributed systems." |
| ❌ | "Dr. Brown retrofitted a DeLorean into a **time machine**." |


  
Text fields in vector search often get overlooked, but they are crucial for hybrid and RAG workflows. The new tokenizer understands language structure better: 

* “Running” and “run” now map together.   
* Common words such as “the” and “is” get ignored. 


The result is a much cleaner and leaner index with precise matches, enabling use cases such as semantic document retrieval with keyword fallback. 

## **MMR Rescoring**

We introduce [Maximal Marginal Relevance (MMR)](http://www.qdrant.tech/documentation/concepts/hybrid-queries/#maximal-marginal-relevance-mmr) rescoring to balance relevance and diversity.  MMR works by selecting the results iteratively: 

* First, it picks the most relevant point, with the highest similarity to the query vector.   
* Then, for each following selection, it picks the item most similar to the query and less similar to the already selected items. 

It prevents your top-k results from being redundant and helps surface varied but relevant answers, particularly in dense datasets with overlapping entries.  

### Idea 1: Diversifying Search Results with MMR

Let’s say you’re building a knowledge assistant or semantic document explorer in which a single query can return multiple highly similar queries. For instance, searching “climate change” in a scientific paper database might return several similar paragraphs. 

You can diversify the results with Maximal Marginal Relevance (MMR).

Instead of returning the top-k results based on pure similarity, MMR helps select a diverse subset of high-quality results. This gives more coverage and avoids redundant results, which is helpful in dense content domains such as academic papers, product catalogs, or search assistants. 

For example, you have vectorized paragraphs from hundreds of documents and stored them in Qdrant. Instead of showing only five nearly identical answers, you want your chatbot to respond with diverse answers. Here’s how to do it:

```python  
from qdrant_client import QdrantClient, models

client = QdrantClient(url="http://localhost:6333")

client.query_points(  
    collection_name="{collection_name}",  
    query=models.NearestQuery(  
        nearest=[0.01, 0.45, 0.67], # search vector  
        mmr=models.Mmr(  
            lambda_=0.5, # 0.0 - diversity; 1.0 - relevance  
            candidate_limit=100, # num of candidates to preselect  
        )  
    ),  
    limit=10,  
)

```

## **Migration to Gridstore**

Qdrant 1.15 continues our transition from RocksDB to [Gridstore](https://qdrant.tech/articles/gridstore-key-value-storage/) as the default storage backend for new deployments, leading to:

* Faster ingestion speeds.   
* Fast lookups and space management.  
* Crash resilience with lazy updates and WAL recovery

We now use Gridstore for all payload indices, such as mutable and immutable ones..  

## **Optimizations**

1.15 introduces HNSW healing, where we remove points from an existing graph and add new links to prevent isolation in the graph, and avoid decreasing search quality.

## **Changes in Web UI**

With Qdrant 1.15, you can create new collections on the UI with a guided process to simplify configuration. This allows you to select options like global search or multi-tenancy and different embedding types, such as simple and hybrid. 

**ADD SCREENSHOT**

This new UI update is helpful for:

* Experimenting interactively without writing JSON by hand.   
* Testing new setups or comparing index configurations.   
* Spinning a proof-of-concept without opening an IDE. 

## **Upgrading to Version 1.15**

In Qdrant Cloud, simply go to your Cluster Details screen and select Version 1.15 from the dropdown. The upgrade may take a few moments.

Figure: Updating to the latest software version from the Qdrant Cloud dashboard.

**ADD SCREENSHOT**

## Conclusion 

We would love to hear your thoughts on this release. If you have any questions or feedback, join our [Discord](https://discord.gg/qdrant) or create an issue on [GitHub](https://github.com/qdrant/qdrant/issues). 