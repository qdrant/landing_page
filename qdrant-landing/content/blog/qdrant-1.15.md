---
title: "Qdrant 1.15.0 - Smarter Quantization, Healing Indexes, and Multilingual Text Filtering"
draft: false
slug: qdrant-1.15.x 
short_description: "Smarter Quantization, Healing Indexes, and Multilingual Text Filtering"
description: "New access control options for RBAC, a much faster shard transfer procedure, and direct support for byte embeddings. " 
preview_image: /blog/qdrant-1.15.x/social_preview.png
social_preview_image: /blog/qdrant-1.15.x/social_preview.png
date: 2025-07-15T00:00:00-08:00
author: Derrick Mwiti
featured: false 
tags:
  - vector search
  - quantization
  - new features
---
# Qdrant 1.15 - Smarter Quantization, Healing Indexes, and Multilingual Text Filtering

[**Qdrant 1.15.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.15.0) Let’s look at the main features for this version: 

**New quantizations:** We introduce asymmetric quantization and 1.5 and 2-bit quantizations. Asymmetric quantization allows vectors and queries to have different quantization algorithms. 1.5 and 2-bit quantizations allow for improved accuracy. 

**HNSW healing**: Allows HNSW indexes to reuse the old graph without a complete rebuild, even if some vectors are updated or deleted, improving resource utilization during frequent index updates. 

**Changes in text index**: Introduction of a new multilingual tokenizer, stopwords support, stemming, and phrase matching. 

## New Quantization Modes
![Quantization](/blog/qdrant-1.15.x/quantization.jpg)
We are expanding the Qdrant quantization toolkit with: 

* **1.5-bit and 2-bit quantization** for better tradeoffs between compression and accuracy.   
* **Asymmetric quantization** to combine binary storage with scalar queries for smarter memory use. 

### 1.5-Bit and 2-Bit Quantization
We introduce a new **binary quantization** storage that uses **2 and 1.5 bits** per dimension, improving precision for smaller vectors. Previous one-bit compression resulted in significant data loss and precision drops for vectors smaller than a thousand dimensions, often requiring expensive rescoring. 2-bit quantization offers 16X compression compared to 32X with one bit, improving performance for smaller vector dimensions. The 1.5-bit quantization compression offers 24X compression and intermediate accuracy. 

A major limitation of binary quantization is poor handling of values close to zero. 2-bit quantization addresses this by explicitly representing zeros using an efficient scoring mechanism. With 1.5-bit quantization we balance the efficiency of binary quantization with accuracy improvements of 2-bit quantization. 

![Quantization](/blog/qdrant-1.15.x/1.5-2-bit-quantization.png)

### Asymmetric Quantization
Asymmetric quantization enhances accuracy while maintaining binary quantization's storage benefits. In **asymmetric Quantization** the queries use a different algorithm, specifically scalar quantization. This approach maintains storage size and RAM usage similar to binary quantization while offering improved precision. It is beneficial for memory-constrained deployments, or where the bottleneck is disk I/O rather than CPU. This is particularly useful for indexing millions of vectors as it improves precision without sacrificing much because the limitation in such scenarios is disk speed, not CPU. This approach requires less rescoring for the same quality output. 

When performing nearest vector search, the query vector is compared against quantized vectors stored in the database. If the query itself remains unquantized and a scoring method exists to evaluate it directly against the compressed vectors, this allows for more accurate results without increasing memory usage.

For example, when building a document retrieval system, you can use scalar quantization for the queries and binary quantization for the stored vectors. 

>  Quantization enables efficient storage and search of high-dimensional vectors. Learn more about this from our [**quantization**](/documentation/guides/quantization/) docs. 

## Changes in Text Index
![Text index](/blog/qdrant-1.15.x/index.jpg)

Let's discover the new features in text indexing. 

### Multilingual Tokenization
Building multilingual systems is challenging because languages have very different structures, complex morphology, and large variations in word usage. Qdrant now supports multilingual tokenization, meaning that search will perform more consistently in multilingual datasets without needing external preprocessing. This means that your system can now natively account for different alphabets, and grammatical structures. 

We previously supported multilingual tokenization but made it optional due to the large binary size. Recent changes in certina languages have made the the binary size smaller and we have enabled multilingual tokenization by default in Qdrant 1.15. With this update you can use a variety of languages in our full-text search index for filters. This means that languages that don't have clear word boundaries and aren't separated by space such as Japanase and Chinese are now natively supported. Previosuly, only languages with spaces were supported, and you had to compile Qdrant yourself. 

Here is how to configure the multilingual tokenizer:

```markdown
PUT /collections/{collection_name}/index
{
  "field_name": "description",
  "field_index_params": {
    "type": "text",
    "tokenizer": "multilingual"
  }
}
```
### Stop Words
Stop words make extracting meaningful information from your data more challenging. Articles like "a", conjunctions like "and", prepostions like "with", pronouns like "he" and common verbs such as "be", can clutter your index without adding value to search. You can remove them manually by creating a stop words list. To make this process even more efficient, Qdrant can now automatically ignore these during indexing and search, helping reduce noise and improve precision.

Here is how to configure stopwords:
```markdown
PUT /collections/{collection_name}/index
{
  "field_name": "title",
  "field_index_params": {
    "type": "text",
    "tokenizer": "multilingual"
  }
}
```
### Stemming
Stemming improves text processing by converting words to their root form. For example “run”, “runs”, and “running” will all map to the root “run”. By using
stemming you only store the root words, reducing the size of the index and increasing retrieval accuracy. It also leads to faster processing time for large volumes of text.

In Qdrant, stemming allows for better query document matching because grammar-related suffixes that don't add meaning to words get removed. We apply stemming in our full-text-search index increasing recall, because a more variety of queries match the same document. For example the queries "interesting documentation" and "interested in this document", will be normalized to ["interest", "document"] and ["interest", "in", "this", "document"], converting them to a very similar query. However, without stemming, these would become ["interesting", "documentation"] and ["interested", "in", "this", "document"], resulting in not a single word matching, despite being very similar in meaning. 

Here is an example showing how to configure the collection to use the [Snowball stemmer](https://snowballstem.org/): 
```markdown
PUT /collections/{collection_name}/index
{
  "field_name": "body",
  "field_index_params": {
    "type": "text",
    "stemmer": {
      "type": "snowball",
      "language": "english"
    }
  }
}
```
### Phrase Matching
With [phrase matching](https://qdrant.tech/documentation/concepts/filtering/#phrase-match), you can now perform exact phrase comparisons, allowing you to search for a specific phrase within a text field. You can configure your collection to support phrase matching as shown below:

```markdown
PUT /collections/{collection_name}/index
{
  "field_name": "headline",
  "field_index_params": {
    "type": "text",
    "phrase_matching": true
  }
}
```


For example, the phrase “machine time” will be matched exactly in that order within the “summary” field:

```markdown
POST /collections/{collection_name}/points/query
{
  "vector": [0.01, 0.45, 0.67, 0.12],
  "filter": {
    "must": {
      "key": "summary",
      "match": {
        "phrase": "machine time"
      }
    }
  },
  "limit": 10
}
```
The above will match:

|  | text |
| -- | --
| ✅ | "The **machine time** is local, rather than global in distributed systems." |
| ❌ | "Dr. Brown retrofitted a DeLorean into a **time machine**." |

## MMR Rescoring
![MMR](/blog/qdrant-1.15.x/MMR.jpg)

We introduce [Maximal Marginal Relevance (MMR)](/documentation/concepts/hybrid-queries/#maximal-marginal-relevance-mmr) rescoring to balance relevance and diversity.  MMR works by selecting the results iteratively, by picking the item with the best combination of similarity to the query and dissimilarity to the already selected items. 

It prevents your top-k results from being redundant and helps surface varied but relevant answers, particularly in dense datasets with overlapping entries.  

### Diversifying Search Results with MMR

Let’s say you’re building a knowledge assistant or semantic document explorer in which a single query can return multiple highly similar queries. For instance, searching “climate change” in a scientific paper database might return several similar paragraphs. 

You can diversify the results with [Maximal Marginal Relevance (MMR)](/documentation/concepts/hybrid-queries/#maximal-marginal-relevance-mmr).

Instead of returning the top-k results based on pure similarity, MMR helps select a diverse subset of high-quality results. This gives more coverage and avoids redundant results, which is helpful in dense content domains such as academic papers, product catalogs, or search assistants. 

For example, you have vectorized paragraphs from hundreds of documents and stored them in Qdrant. Instead of showing only five nearly identical answers, you want your chatbot to respond with diverse answers. Here’s how to do it:

```markdown  
POST /collections/{collection_name}/points/query
{
  "query": {
    "nearest": [0.01, 0.45, 0.67, ...], // search vector
    "mmr": {
      "diversity": 0.5, // 0.0 - relevance; 1.0 - diversity
      "candidate_limit": 100 // num of candidates to preselect
    }
  },
  "limit": 10
}
```

## Migration to Gridstore
![Gridstore](/blog/qdrant-1.15.x/gridstore.jpg)
When we started building Qdrant, we picked RocksDB as our embedded key-value store. However, due to it's architecture we ran into issues such as random latency spikes. [Gridstore](https://qdrant.tech/articles/gridstore-key-value-storage/) is our custom solution to this and other challenges we faced when building with RocksDB. Qdrant 1.15 continues our transition from RocksDB to [Gridstore](https://qdrant.tech/articles/gridstore-key-value-storage/) as the default storage backend for new deployments, leading to:

* Faster ingestion speeds.   
* Fast lookups and space management.  
* Crash resilience with lazy updates and WAL recovery

> For more insights on the performance of Gridstore compared to RocksDB checkout our [**Introducing Gridstore**](https://qdrant.tech/articles/gridstore-key-value-storage/#end-to-end-benchmarking) article. 

## Optimizations
Qdrant 1.15 introduces HNSW healing. When points are removed from an existing [graph](https://qdrant.tech/documentation/concepts/indexing/#vector-index), new links are added to prevent isolation in the graph, and avoid decreasing search quality.

> Our [**Optimizing Qdrant Performance**](/documentation/guides/optimize/) guide covers different optimization strategies. 

## Changes in Web UI
With Qdrant 1.15, you can create new collections from the UI with a guided process to simplify configuration. The new UI covers the most typical configurations, so it helps you set up your collection correctly, even if you're just starting.

![create-collection01](/blog/qdrant-1.15.x/create-collection02.png)

This new UI update is helpful for:

* Experimenting interactively without writing JSON by hand.   
* Spinning a proof-of-concept without opening an IDE. 

## Upgrading to Version 1.15

In Qdrant Cloud, simply go to your Cluster Details screen and select Version 1.15 from the dropdown. The upgrade may take a few moments.

> Upgrading from earlier versions is straightforward - no major API or index-breaking changes. We recommend upgrading versions one by one, for example, 1.13 ->1.14->1.15. 

**Figure**: Updating to the latest software version from the Qdrant Cloud dashboard.

**ADD SCREENSHOT**

**Documentation**: For detailed usage examples, configuration options, and implementation guides, including quantization, MMR rescoring, multilingual text indexing, and more, refer to the official [Qdrant documentation](https://qdrant.tech/documentation) and [API reference](https://api.qdrant.tech). You'll find full code samples, integration walkthroughs, and best practices for building high-performance vector search applications.
## Conclusion

We would love to hear your thoughts on this release. If you have any questions or feedback, join our [Discord](https://discord.gg/qdrant) or create an issue on [GitHub](https://github.com/qdrant/qdrant/issues). 