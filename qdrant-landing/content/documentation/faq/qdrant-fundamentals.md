---
title: Qdrant Fundamentals
weight: 1
---

# Frequently Asked Questions: General Topics
||||||
|-|-|-|-|-|
|[Vectors](/documentation/faq/qdrant-fundamentals/#vectors)|[Search](/documentation/faq/qdrant-fundamentals/#search)|[Collections](/documentation/faq/qdrant-fundamentals/#collections)|[Compatibility](/documentation/faq/qdrant-fundamentals/#compatibility)|[Cloud](/documentation/faq/qdrant-fundamentals/#cloud)|

## Vectors

### What is the maximum vector dimension supported by Qdrant?

Qdrant supports up to 65,535 dimensions by default, but this can be configured to support higher dimensions.

### What is the maximum size of vector metadata that can be stored?

There is no inherent limitation on metadata size, but it should be [optimized for performance and resource usage](/documentation/guides/optimize/). Users can set upper limits in the configuration.

### Can the same similarity search query yield different results on different machines?

Yes, due to differences in hardware configurations and parallel processing, results may vary slightly.

### What to do with documents with small chunks using a fixed chunk strategy?

For documents with small chunks, consider merging chunks or using variable chunk sizes to optimize vector representation and search performance.

### How do I choose the right vector embeddings for my use case?

This depends on the nature of your data and the specific application. Consider factors like dimensionality, domain-specific models, and the performance characteristics of different embeddings.

### How does Qdrant handle different vector embeddings from various providers in the same collection?

Qdrant natively [supports multiple vectors per data point](/documentation/concepts/vectors/#multivectors), allowing different embeddings from various providers to coexist within the same collection.

### Can I migrate my embeddings from another vector store to Qdrant?

Yes, Qdrant supports migration of embeddings from other vector stores, facilitating easy transitions and adoption of Qdrant’s features.

## Search 

### How does Qdrant handle real-time data updates and search?

Qdrant supports live updates for vector data, with newly inserted, updated and deleted vectors available for immediate search. The system uses full-scan search on unindexed segments during background index updates.

### My search results contain vectors with null values. Why?

By default, Qdrant tries to minimize network traffic and doesn't return vectors in search results.
But you can force Qdrant to do so by setting the `with_vector` parameter of the Search/Scroll to `true`.

If you're still seeing `"vector": null` in your results, it might be that the vector you're passing is not in the correct format, or there's an issue with how you're calling the upsert method.

### How can I search without a vector?

You are likely looking for the [scroll](/documentation/concepts/points/#scroll-points) method. It allows you to retrieve the records based on filters or even iterate over all the records in the collection.

### Does Qdrant support a full-text search or a hybrid search?

Qdrant is a vector search engine in the first place, and we only implement full-text support as long as it doesn't compromise the vector search use case.
That includes both the interface and the performance.

What Qdrant can do:

- Search with full-text filters
- Apply full-text filters to the vector search (i.e., perform vector search among the records with specific words or phrases)
- Do prefix search and semantic [search-as-you-type](/articles/search-as-you-type/)
- Sparse vectors, as used in [SPLADE](https://github.com/naver/splade) or similar models
- [Multi-vectors](/documentation/concepts/vectors/#multivectors), for example ColBERT and other late-interaction models
- Combination of the [multiple searches](/documentation/concepts/hybrid-queries/)

What Qdrant doesn't plan to support:

- Non-vector-based retrieval or ranking functions
- Built-in ontologies or knowledge graphs
- Query analyzers and other NLP tools

Of course, you can always combine Qdrant with any specialized tool you need, including full-text search engines.
Read more about [our approach](/articles/hybrid-search/) to hybrid search.

## Collections

### How many collections can I create?

As many as you want, but be aware that each collection requires additional resources.
It is _highly_ recommended not to create many small collections, as it will lead to significant resource consumption overhead.

We consider creating a collection for each user/dialog/document as an antipattern.

Please read more about collections, isolation, and multiple users in our [Multitenancy](/documentation/tutorials/multiple-partitions/) tutorial.

### How do I upload a large number of vectors into a Qdrant collection?

Read about our recommendations in the [bulk upload](/documentation/tutorials/bulk-upload/) tutorial.

### Can I only store quantized vectors and discard full precision vectors?

No, Qdrant requires full precision vectors for operations like reindexing, rescoring, etc.

## Compatibility

### Is Qdrant compatible with CPUs or GPUs for vector computation?

Qdrant primarily relies on CPU acceleration for scalability and efficiency. However, we also support GPU-accelerated indexing on all major vendors.

### Do you guarantee compatibility across versions?

In case your version is older, we only guarantee compatibility between two consecutive minor versions. This also applies to client versions. Ensure your client version is never more than one minor version away from your cluster version.
While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.

### Do you support downgrades?

We do not support downgrading a cluster on any of our products. If you deploy a newer version of Qdrant, your
data is automatically migrated to the newer storage format. This migration is not reversible.

### How do I avoid issues when updating to the latest version?

We only guarantee compatibility if you update between consecutive versions. You would need to upgrade versions one at a time: `1.1 -> 1.2`, then `1.2 -> 1.3`, then `1.3 -> 1.4`.

## Cloud

### Is it possible to scale down a Qdrant Cloud cluster?

It is possible to vertically scale down a Qdrant Cloud cluster, as long as the disk size is not reduced. Horizontal downscaling is currently not possible, but on our roadmap.
But in some cases, we might be able to help you with that manually. Please open a support ticket, so that we can assist.
