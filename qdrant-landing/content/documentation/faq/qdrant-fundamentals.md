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
- Sparse vectors, as used in [SPLADE](https://github.com/naver/splade) or similar models

What Qdrant plans to introduce in the future:

- ColBERT and other late-interruction models
- Fusion of the multiple searches

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

### Do you support downgrades?

We do not support downgrading a cluster on any of our products. If you deploy a newer version of Qdrant, your
data is automatically migrated to the newer storage format. This migration is not reversible.

### How do I avoid issues when updating to the latest version?

We only guarantee compatibility if you update between consecutive versions. You would need to upgrade versions one at a time: `1.1 -> 1.2`, then `1.2 -> 1.3`, then `1.3 -> 1.4`.

### Do you guarantee compatibility across versions?

In case your version is older, we only guarantee compatibility between two consecutive minor versions. This also applies to client versions. Ensure your client version is never more than one minor version away from your cluster version.
While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.

### Which embedding models does FastEmbed support, and how does it utilize memory?

You can find the list of supported models [here](https://qdrant.github.io/fastembed/examples/Supported_Models/).

Memory usage in fastEmbed depends on several factors:
1. **Size of the Text**: Everything, including the text and its vectors, is loaded into memory. As vectors are computed, RAM consumption increases accordingly.
2. **Data Parallelism**: fastEmbed utilizes Python's multiprocessing to split large lists of strings into smaller ones and process them in parallel. While this enhances processing speed, it can also lead to higher RAM consumption.
3. **Model Used**: Memory usage varies depending on the model used to embed your data.

For optimal performance and memory management, consider these factors when using fastEmbed.

### How does your cloud handle shard rebalancing when increasing the number of nodes?

Our [cloud platform](https://cloud.qdrant.io) handles shard rebalancing when scaling out. However, it's essential to create enough shards beforehand to facilitate the scaling process effectively. For instance, if you have 3 nodes, it's advisable to choose 6 or 9 shards to allow for rebalancing upon extending your cluster, which wouldn't be possible with just 3 shards.