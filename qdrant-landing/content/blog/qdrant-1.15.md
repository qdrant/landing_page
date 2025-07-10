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

![asymetric-quantization](/blog/qdrant-1.15.x/asymetric-quantization.png)

## **Changes in Text Index**

Building multilingual systems is challenging because languages have very different structures, complex morphology, and large variations in word usage. Qdrant now supports multilingual tokenization, meaning that search will perform more consistently in multilingual datasets without needing external preprocessing. This means that your system can now natively account for different alphabets, grammatical structures, and idiomatic expressions. With multilingual tokenization, your system will perform well across various tasks by accurately representing the structure and meaning of text in different languages.

Here is how to configure the multilingual tokenizer:

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        tokenizer=models.TokenizerType.MULTILINGUAL,
    ),
)
```

Stop words make extracting meaningful information from your data more challenging. Articles like "a", conjunctions like "and", prepostions like "with", pronouns like "he" and common verbs such as "be", can clutter your index without adding value to search. You can remove them manually by creating a stop words list. To make this process even more efficient Qdrant can now automatically ignore these during indexing and search, helping reduce noise and improve precision.

Here is how to configure stopwords:
```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        stopwords="english"
    ),
)
```
Stemming improves text processing by converting words to their root form. For example “run”, “runs”, and “running” will all map to the root “run”. By using
stemming you only store the root words, reducing the size of the index and increasing retrieval accuracy. It also leads to faster processing time for large volumes of text.

You can configure the stemmer as shown below:
```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        stemmer=models.SnowballParams(
            type="snowball",
            language="english"
        )
    ),
)
```
With [phrase matching](https://qdrant.tech/documentation/concepts/filtering/#phrase-match), you can now perform exact phrase comparisons, allowing you to search for a specific phrase within a text field. You can configure your collection to support phrase matching as shown below:

```python
client.create_payload_index(
    collection_name="{collection_name}",
    field_name="name_of_the_field_to_index",
    field_schema=models.TextIndexParams(
        type="text",
        phrase_matching=True
    ),
)
```


For example, the phrase “machine time” will be matched exactly in that order within the “summary” field:

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

## **MMR Rescoring**

We introduce [Maximal Marginal Relevance (MMR)](http://www.qdrant.tech/documentation/concepts/hybrid-queries/#maximal-marginal-relevance-mmr) rescoring to balance relevance and diversity.  MMR works by selecting the results iteratively, by picking the item with the best combination of similarity to the query and dissimilarity to the already selected items. 

It prevents your top-k results from being redundant and helps surface varied but relevant answers, particularly in dense datasets with overlapping entries.  

### **Diversifying Search Results with MMR**

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


![create-collection01](/blog/qdrant-1.15.x/create-collection01.png)
![create-collection01](/blog/qdrant-1.15.x/create-collection02.png)

This new UI update is helpful for:

* Experimenting interactively without writing JSON by hand.   
* Testing new setups or comparing index configurations.   
* Spinning a proof-of-concept without opening an IDE. 

## **Upgrading to Version 1.15**

In Qdrant Cloud, simply go to your Cluster Details screen and select Version 1.15 from the dropdown. The upgrade may take a few moments.

Figure: Updating to the latest software version from the Qdrant Cloud dashboard.

**ADD SCREENSHOT**

## **Conclusion** 

We would love to hear your thoughts on this release. If you have any questions or feedback, join our [Discord](https://discord.gg/qdrant) or create an issue on [GitHub](https://github.com/qdrant/qdrant/issues). 