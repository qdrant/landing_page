---
title: "Qdrant 1.16 - Scalable Multitenancy & Disk-Efficient Vector Search"
draft: false
slug: qdrant-1.16.x
short_description: "v1.16 of Qdrant focuses on scalable multitenancy with tenant promotion and disk-efficient vector search."
description: "v1.16 of Qdrant focuses on scalable multitenancy with tenant promotion, disk-efficient vector search with inline storage, and improved filtered vector search with ACORN."
date: 2025-11-19T00:00:00-08:00
author: Abdon Pijpelink
featured: true
tags:
  - vector search
  - disk-based vector search
  - scalable multitenancy
---

[**Qdrant 1.16.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.16.0) Let’s look at the main features for this version:

**Scalable Multitenancy:** An improved approach to multitenancy that enables you to combine small and large tenants in a single collection, with the ability to promote growing tenants to dedicated shards.

**ACORN**: A new search algorithm that improves the quality of filtered vector search in cases of high filtering selectivity.

**Inline Storage**: A new HNSW index storage mode that stores vector data directly inside HNSW nodes, enabling efficient disk-based vector search.

Additionally, version 1.16 introduces a new conditional update API, facilitating easier migration of embedding models to a newer version. And, this version improved Qdrant's full-text search capabilities with a new `text_any` condition and ASCII folding support.

## Scalable Multitenancy Using Tenant Promotion
  
![Section 1](/blog/qdrant-1.15.x/section-1.png)

Multitenancy is a common requirement for SaaS applications, where multiple customers (tenants) share the same database instance. In Qdrant, you may be tempted to create a separate collection for each tenant, but that is not recommended. Each collection incurs a bit of resource overhead. When you have a large number of collections, this leads to increased costs, and at some point, you may see performance degradation and cluster instability. Instead, Qdrant offers two approaches to multitenancy:

- [Payload-based multitenancy](/documentation/guides/multiple-partitions/), which works well when you have a large number of small tenants. This causes practically no overhead. Quite the opposite: a query with a tenant payload filter can be faster than a full search.
- [Shard-based multitenancy](/documentation/guides/distributed_deployment/#user-defined-sharding), designed for when you have a smaller number of larger tenants. This works well when each tenant requires isolation and dedicated resources.

Real-world usage patterns often fall between these two use cases. It's common to have a small number of large tenants and a huge tail of smaller ones. You may even have tenants that grow over time, starting small and eventually becoming large enough to require dedicated resources.

In version 1.16, Qdrant can now efficiently combine the two multitenancy approaches with a new feature called Tenant Promotion.

The main principles behind Tenant Promotion are:

- A multitenant collection can consist of a shared "fallback" shard, which is used for small tenants, and multiple dedicated shards for large tenants.
- Each query specifies routing to a dedicated shard, as well as a tenant filter for the fallback shard. This ensures that it doesn't matter where the data resides: the query returns the correct results. In other words, the location of tenants is transparent to the application.
- When a tenant grows beyond a certain threshold, it is now possible to "promote" it to a dedicated shard, moving all of the tenant's data from the shared shard to the new dedicated shard. This process is implemented as a background operation that maintains data consistency. It doesn't block other operations on the collection.

Being able to promote a tenant to its own dedicated shard prevents a classic noisy neighbor problem where a single high-volume tenant can force the cluster to scale for everyone, increasing costs and reducing performance for smaller tenants.

To query a collection that contains a shared fallback shard and dedicated shards, use both a tenant filter and fallback routing:

```json
TODO: One snippet that demonstrates a request to collection with "fallback" routing.
```

Once a tenant grows beyond a certain threshold, you can promote that tenant to its own dedicated shard:

```json
- One snippet which demonstrates a tenant promotion request.
Examples can be found in the integration test: https://github.com/qdrant/qdrant/blob/dev/tests/consensus_tests/test_tenant_promotion.py
```

Known limitations:

- The default shard key can have only one shard ID. Future releases will support multiple shard IDs per shard key.
- Tenant promotion must be triggered manually. We plan to add auto-promotion to Qdrant Cloud in the future.

## ACORN - Filtered Vector Search Improvements

![Section 2](/blog/qdrant-1.15.x/section-2.png)

To enhance the scalability and speed of vector search, Qdrant employs a graph-based index structure known as [HNSW (Hierarchical Navigable Small World)](/documentation/concepts/indexing/#vector-index). While traditional HNSW is primarily designed for unfiltered searches, Qdrant has addressed this limitation by implementing a [filterable HSNW index](/articles/filtrable-hnsw/). This innovative approach extends the HNSW graph with additional edges that correspond to indexed payload values. This enables Qdrant to maintain search quality even with high filtering selectivity, without introducing any runtime overhead during the search process.

Even with filterable HNSW graphs, there are instances where the quality of search results can deteriorate significantly. This can happen if a filter discards too many vectors, leading to the HNSW graph becoming [disconnected](/documentation/concepts/indexing/#filtrable-index), especially when you use a combination of high cardinality filters. It is impractical to build additional links for every possible combination of filters in advance due to the potentially vast number of combinations. Another case where filterable HNSW may break down is in situations where filtering criteria are not known in advance.

To address these limitations, in version 1.16 we are introducing support for [ACORN](documentation/concepts/search/#acorn-search-algorithm), based on the ACORN-1 algorithm described in the paper [ACORN: Performant and Predicate-Agnostic Search Over Vector Embeddings and Structured Data](https://arxiv.org/abs/2403.04871). With ACORN enabled, Qdrant not only traverses direct neighbors (the first hop) in the HNSW graph but also examines neighbors of neighbors (the second hop) if the direct neighbors have been filtered out. This enhancement improves search accuracy at the expense of performance, especially when multiple low-selectivity filters are applied.

You can enable ACORN on a per-query basis, via the optional query-time `acorn` parameter. This doesn't require any changes at index time.

```json
TODO, after it's merged, add code snippet < code-snippet path="/documentation/headless/snippets/query-points/with-acorn/ >
```

TODO: Benchmarks of ACORN ...

### When Should You Use ACORN?

Enabling ACORN allows Qdrant to explore more nodes within the HNSW graph, which results in the evaluation of a larger number of vectors. This does come with some runtime overhead and should not be enabled on every query. 

To help you choose when to use ACORN, refer to the following decision matrix:

| Use case | Use ACORN? | Effect | Impact |
|---|---|---|---|
| No filters  | No | HNSW |  No overhead |
| Single filter  | No | HNSW + payload index | No overhead |
| Multiple filters, high selectivity | No | HNSW + payload index | No overhead |
| Multiple filters, low selectivity | Yes | HNSW + Payload index + ACORN | Some overhead, better quality |

## Inline Storage - Disk-efficient Vector Search

![Section 3](/blog/qdrant-1.15.x/section-3.png)

Deploying a vector search engine into Production often requires striking a balance between performance and cost. A good example of this trade-off is the decision between RAM-based storage and disk-based storage for the HNSW index. HNSW was designed to be an in-memory index structure. Traversing the HNSW graph involves a lot of random access reads, which is fast in RAM, but slow on disk.

For instance, querying 1 million vectors with the HNSW parameters `m` set to 16 and `ef` to 100 requires approximately 1200 vector comparisons. This is fine in  RAM, but it is slow on disk, where each random access read can take up to 1ms, or even longer when using HDDs instead of SSDs.

However, disk-based storage has a property we can exploit to reduce the number of random access reads: paged reading. Disk devices typically read a full page (4KB or more) of data at once. Traditional tree-based data structures, such as B-trees, have used this property effectively. However, in graph-based structures like the HNSW index, grouping connected nodes into pages is not straightforward due to each node potentially having an arbitrary number of connections to other nodes.

That is, unless we can duplicate the data associated with each node. This is now possible with a new feature in Qdrant version 1.16: [inline storage](documentation/guides/optimize/#inline-storage-in-hnsw-index), storing vector data directly inside the HNSW nodes. This offers faster read access, at the cost of additional storage space.

Let's do some napkin math:

- An HNSW graph has `M0` = `M` * 2 = 32 connections per node (by default)
- Each vector is around 1024 x 4 bytes = 4Kb
- Each node would need to store `M0` x 4Kb = 128Kb
- However, each page is only 4Kb

So, how can we take advantage of this? By using quantization and smaller datatypes:

- Use `float16` instead of `float32`: a 2x space reduction
- Use binary quantization: a 32x space reduction

TODO: Layout without inline storage (should be a picture)

- Node -> Neighbor1_id, Neighbor2_id, ... Neighbor32_id (32 x 4 bytes = 128 bytes)
- Vector -> 1024 x 4 bytes = 4096 bytes
- Quantized Vector -> 1024 / 8 bits = 128 bytes (1 bit per dimension)

TODO: New layout with inline storage & float16 & binary quantization (should be a picture)

- Node -> (neighbours_list) + (original vectors) + (neighbors' quantized vectors)
- 128 bytes + 1024 x 2 + (32 x 128 bytes) = 6272 bytes ~ 2 pages (8Kb)

When combining inline storage with `float16` data types and quantization, evaluating a node in the HNSW graph requires reading only 2 pages from disk, rather than making 32 random access reads. This represents a significant improvement over the traditional approach, at the cost of additional storage space.

TODO: ... Benchmarks of Inline Storage ...

Inline storage can be enabled by setting a collection's HNSW configuration `inline_storage` option to `true`.  It requires quantization to be enabled.

```json
TODO, after it's merged, add code snippet < code-snippet path="/documentation/headless/snippets/create-collection/with-inline-storage/" >
```

## Full-Text Search Enhancements

![Section 4](/blog/qdrant-1.15.x/section-4.png)

While Qdrant is primarily a vector search engine, many applications require a combination of vector search and traditional full-text search. For that reason, we are continuously enhancing our full-text search capabilities. In version 1.16, we have introduced two new features to improve the full-text search experience in Qdrant.

### Match Any Condition for Text Search

Prior to version 1.16, Qdrant supported two ways of searching for multiple search terms in text fields: the `text` condition that searches for all search terms, and the `phrase` condition that searches for an exact phrase match. 

However, there was no convenient way to search to match *at least one* of the provided query terms. You would have to tokenize a multi-term query yourself on the client side and build a complex boolean condition with multiple `match` conditions:

```json
{
  "should": [
    { "match": { "text": "apple" } },
    { "match": { "text": "banana" } },
    { "match": { "text": "cherry" } }
  ]
}
```

In version 1.16, we have added a new [`text_any` condition](/documentation/concepts/filtering/#full-text-any) that simplifies this use case. Now, instead of building complex boolean conditions, Qdrant can handle the tokenization and matching internally. 

The `text_any` condition matches text fields that contain any of the query terms. In other words, even if a text field contains just one of the query terms, it is considered a match.

```json
{
  "match": {
    "text_any": "apple banana cherry"
  }
}
```

A good example of using the `text_any` condition is in e-commerce applications, where users often search for products using multiple keywords. By combining a vector query with a series of increasingly lenient full-text filters, you can ensure that users receive relevant results even if their initial search terms are too restrictive. 

```json
batch [
  {
    "query": {
      "text": "best smartphone ever",
      "model": "sentence-transformers/all-MiniLM-L6-v2"
    },
    "filter": {
      "must": {
        "key": "description",
        "match": {
          "text": "5G 5000mAh OLED"
        }
      }
    }
  },
  {
    "query": {
      "text": "best smartphone ever",
      "model": "sentence-transformers/all-MiniLM-L6-v2"
    },
    "filter": {
      "must": {
        "key": "description",
        "match": {
          "text_any": "5G 5000mAh OLED"
        }
      }
    }
  },
  {
    "query": {
      "text": "best smartphone ever",
      "model": "sentence-transformers/all-MiniLM-L6-v2"
    }
  }
]
```

### ASCII Folding - Improved Search for Multilingual Texts

Many Latin languages use diacritical marks (accents) to indicate different pronunciations or meanings of letters. For example, the letter "é" in French is pronounced differently from "e" and can change the meaning of a word. Users, when searching for terms with diacritics, may not always include these marks in their queries, which can lead to missed matches.

A solution to this problem is to normalize characters with diacritics to their base ASCII equivalents, a process known as ASCII folding. For example, "café" becomes "cafe" and "naïve" becomes "naive." This normalization allows for more flexible and inclusive search results, improving search recall for multilingual texts.

[An open source contribution by community member eltu](https://github.com/qdrant/qdrant/pull/7408) has added [ASCII folding support](/documentation/concepts/indexing/#ascii-folding) to Qdrant's full-text search capabilities in version 1.16. When enabled, Qdrant automatically normalizes text fields and search terms, for instance by removing diacritical marks.

To enable ASCII folding, set the `ascii_folding` option to `true` when creating a full-text payload index:

```json
TODO, after it's merged, add code snippet < code-snippet path="/documentation/headless/snippets/create-payload-index/asciifolding-full-text/" >
```

## Conditional Updates

![Section 5](/blog/qdrant-1.15.x/section-4.png)

Point updates in Qdrant are idempotent, meaning that applying the same update multiple times has the same effect as applying it once. This can cause issues when two clients attempt to update the same point concurrently, as the last update will overwrite any previous updates. Consider the following sequence of events:

1. Client A reads point P.
2. Client B reads point P.
3. Client A modifies point P and writes it back to Qdrant.
4. Client B modifies point P (based on stale data) and writes it back to Qdrant, unintentionally overwriting changes made by Client A.

To address this issue, Qdrant 1.16 introduces support for [conditional updates](/documentation/concepts/points/#conditional-updates). With conditional updates, you can specify a condition, in the form of an update filter, that must be met for the update to be applied. If the condition is not met, Qdrant rejects the update, preventing unintended overwrites.

For example, you can add a `version` field to your points to track changes. When updating a point, you can specify a condition that the `version` field must match the expected value. If another client has modified the point in the meantime and incremented the `version`, the update is rejected: 

```json
TODO, after it's merged, add code snippet < code-snippet path="/documentation/headless/snippets/insert-points/with-condition/" >
```

Note that the name and type of the field used for conditional updates are entirely up to you. Instead of `version`, applications can use timestamps (assuming synchronized clocks) or any other monotonically increasing value that fits their data model.

This mechanism is particularly useful in scenarios involving embedding model migration, where it is necessary to resolve conflicts between regular application updates and background re-embedding tasks.

TODO, after it's merged, add image < figure src="/docs/embedding-model-migration.png" caption="Embedding model migration in blue-green deployment" width="80%" >

## Web UI Visual Upgrade

![Section 6](/blog/qdrant-1.15.x/section-4.png)

[Web UI](/documentation/web-ui/) is Qdrant’s user interface for managing deployments and collections. It enables you to create and manage collections, run API calls, import sample datasets, and learn about Qdrant's API through interactive tutorials.

In version 1.16, we have revamped the Web UI with a fresh new look and improved user experience. The new design features the following enhancements:

- A new welcome page that offers quick access to tutorials and reference documentation.
- Redesigned Point, Visualize, and Graph views in the Collections manager, making it easier to work with your data by presenting it in a more compact format.
- In the tutorials, code snippets are now executed inline, which frees up screen space for better usability.

![Qdrant Web UI](/blog/qdrant-1.16.x/webui.png)

## Honorable Mentions

![Section 6](/blog/qdrant-1.15.x/section-4.png)

TODO: All other notable improvements in a list with links to further reading.

- RRF with configurable parameters.
- Metrics upgrade
- More performance improvements & bug fixes, but we will know about them after the changelog is out.


## Engage

![Engage](/blog/qdrant-1.15.x/section-4.png)
