---
title: Fundamentals
weight: 1
---

## Qdrant Fundamentals

### How many collections can I create?

As much as you want, but be aware that each collection requires additional resources.
It is _highly_ recommended not to create many small collections, as it will lead to significant resource consumption overhead.

We consider creating a collection for each user/dialog/document as an antipattern.

Please read more about collections, isolation, and multiple users in our [Multitenancy](../../tutorials/multiple-partitions/) tutorial.

### My search results contain vectors with null values. Why?

By default, Qdrant tries to minimize network traffic and doesn't return vectors in search results.
But you can force Qdrant to do so by setting the `with_vector` parameter of the Search/Scroll to `true`. 

If you're still seeing `"vector": null` in your results, it might be that the vector you're passing is not in the correct format, or there's an issue with how you're calling the upsert method.

### How can I search without a vector?

You are likely looking for the [scroll](../../concepts/points/#scroll-points) method. It allows you to retrieve the records based on filters or even iterate over all the records in the collection.

### Does Qdrant support a full-text search or a hybrid search?

Qdrant is a vector search engine in the first place, and we only implement full-text support as long as it doesn't compromise the vector search use case.
That includes both the interface and the performance.

What Qdrant can do:

- Search with full-text filters
- Apply full-text filters to the vector search (i.e., perform vector search among the records with specific words or phrases)
- Do prefix search and semantic [search-as-you-type](../../../articles/search-as-you-type/)

What Qdrant plans to introduce in the future:

- Support for sparse vectors, as used in [SPADE](https://github.com/naver/splade) or similar models

What Qdrant doesn't plan to support:

- BM25 or other non-vector-based retrieval or ranking functions
- Built-in ontologies or knowledge graphs
- Query analyzers and other NLP tools

Of course, you can always combine Qdrant with any specialized tool you need, including full-text search engines.
Read more about [our approach](../../../articles/hybrid-search/) to hybrid search.  

### How do I upload a large number of vectors into a Qdrant collection?

Read about our recommendations in the [bulk upload](../../tutorials/bulk-upload/) tutorial.

### Can I only store quantized vectors and discard full precision vectors? 

No, Qdrant requires full precision vectors for operations like reindexing, rescoring, etc.

## Qdrant Cloud

### Is it possible to scale down a Qdrant Cloud cluster?

In general, no. There's no way to scale down the underlying disk storage.
But in some cases, we might be able to help you with that through manual intervention, but it's not guaranteed.

## Versioning

### How do I avoid issues when updating to the latest version?

We only guarantee compatibility if you update between consequent versions. You would need to upgrade versions one at a time: `1.1 -> 1.2`, then `1.2 -> 1.3`, then `1.3 -> 1.4`.

### Do you guarantee compatibility across versions?

In case your version is older, we guarantee only compatibility between two consecutive minor versions.
While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.

