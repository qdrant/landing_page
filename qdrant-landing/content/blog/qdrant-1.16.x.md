---
title: "Qdrant 1.16 - Scalable Multitenancy, Disk-Efficient Vector Search and Edge Beta"
draft: false
slug: qdrant-1.16.x
short_description: "v1.16 of Qdrant focuses on scalability and operational efficiency"
description: "ToDO: add description"
date: 2025-11-19T00:00:00-08:00
author: Abdon Pijpelink
featured: true
tags:
  - vector search
  - disk-based vector search
  - scalable multitenancy
---

[**Qdrant 1.16.0 is out!**](https://github.com/qdrant/qdrant/releases/tag/v1.16.0) Let’s look at the main features for this version:

**Scalable Multitenancy:** TODO

**ACORN**: TODO

**Inline Storage**: TODO

<!-- On top of that Qdrant release includes improvements to conditional update API, which allows simpler collection migrations into newer versions of embedding models,
fills the gap in text search API with `text_any` condition in addition to existing "match all" and "match phrase" conditions. -->


## Tenant Promotion - Scalable Multitenancy
  
![Section 1](/blog/qdrant-1.15.x/section-1.png)

Currently, Qdrant supports 2 aproaches to multitenancy:

- Payload-based multitenancy (link) - perfect for huge amount of small tenants, have practically zero overhead for tenant (and actually even more optimized than full search).
- Shard-based multitenancy (link to custom sharding docs) - designed for smaller amount of larger tenants, which require isolation and dedicated resources.


But the real-world usage patterns are often more complex. Most likely the use-case will contain small amount of large tenants and huge tail of smaller ones.
Now Qdrant can efficintly combine those two approaches with Tenant Promotion feature.

Main principles:

- Collection should have a "shared" shard, which is used for small tenants, and large tenants occupy dedicated shards.
- Each query to the database contain both: routing to the dedicated shard and filter. So it doesn't matter where the data is located, the query will return correct results. Aka placement of tenants is transparent to the application.
- When a tenant grows beyond certain threshold, it is now possible to "promote" it to a dedicated shard, moving all data from shared shard to the new dedicated one. This process is implemented as a background operation which maintains consistency of data and doesn't block other operations on the collection.


Snippets:

- One snippet which demostrates a request to collection with "fallback" routing.
- One snippet which demostrates tenant promotion request.

Examples can be found in the integration test: https://github.com/qdrant/qdrant/blob/dev/tests/consensus_tests/test_tenant_promotion.py


Known limitations:

- Default shard-key can have only one shard-id. We will improve it in future releases to support multiple shard-ids per shard-key. 
- tenant promotion must be triggered manually. We plan to add auto-promotion in cloud offering in future.

## ACORN - filtered search improvements

When we are doing HNSW searhc with filtering, we need to be careful about how many vectors we filter-out during search.

If we filter out too many, HNSW graph can become disconnected (link to filterable HNSW article).

Currently, Qdrant have a specialized process, which extends HNSW graph with additional links based on payload indexes.
This process allows us to maintain search quality even with high filtering selectivity and do not introduce any runtime overhead during search.

There are, however, cases, when additional links might not be enough.
For example, if combination of high cardinality filters is used, we can't build extra links for all combinations in advance, as there might be too many of them.
Or, if filtering critetians are not known in advance.

To adresss such cases, we are introducing ACORN (link arxiv) query-time parameter. It doesn't require any index-time changes.
ACORN allows graph traversal algorithm to "jump" over filtered-out vectors during search, improving connectivity of the graph during search with filters.

This, however, introduces runtime overhead during search, as more vectors need to be evaluated.


... Benchmarks of ACORN ...


... Decision matrix when to use ACORN ...


- No filters = No ACORN, no overhead

- Single filter = Payload index, no ACORN, no overhead

- Multiple filters, high selectivity = Payload index, No overhead

- Multiple filters, low selectivity = Payload index + ACORN, some overhead, better quality

... Snippet of how to use ACORN ...


## Inline Storage - Disk-efficient Vector Search

![Section 2](/blog/qdrant-1.15.x/section-2.png)

HSNW was designed as an in-memory index structure. Graph traversal operation invokes a lot of random accesses to memory.

For instance, 1M vectors with m=16 and ef=100 will require around ~1200 vector comparisons.

For RAM is is ok-ish, but not acceptable for disk-based storage, where one random access can take up to 1ms (on SSDs, HDDs are even worse).

There is, however, a property of Disk-based storage, we can exploit to minimize number of random memory accesses needed - this property is paged reading (the idea is that disk always reads 1 page (4Kb or more) of data at once)

Traditional Tree-based data structures already use this property since forever - see B-trees. But it is not that straightforward in graph-based structures like HNSW.
In graphs each node can have arbitrary number of connections to other nodes, so it is not possible to group connected nodes into pages.

This is unless we can duplicate data associated with nodes.

That is what Inline Storage does - it stores vector data  directly inside HNSW nodes.

Let's do some napkin math:

- HNSW graph have M0=M * 2 = 32 connections per node (by default)
- Each vectors is around 1024 x 4 bytes = 4Kb
- Each node would need to store M0 x 4Kb = 128Kb
- Each page is 4Kb

So, how to take advantage of this?

Answer: use quantization & smaller datatypes.

- Use flaot16 instead of float32 - 2x space reduction
- Use binary quantization - 32x space reduction

  Current memory layout (should be a picture)

  - Node -> Neighbor1_id, Neighbor2_id, ... Neighbor32_id (32 x 4 bytes = 128 bytes)
  - Vector -> 1024 x 4 bytes = 4096 bytes
  - Quantized Vector -> 1024 / 8 bits = 128 bytes (1 bit per dimension)


New memory layout with inline storage & float16 & binary quantization (should be a picture)

- Node -> (neighbours_list) + (original vectors) + (neighbors' quantized vectors)


128 bytes + 1024 x 2 + (32 x 128 bytes) = 6272 bytes ~ 2 pages (8Kb)

So, with new memory layout, instead of 32 random accesses to read neighbors' vectors, we need only sequential read of 2 pages.


... Benchmarks of Inline Storage ...


... Snippet of how to use Inline Storage ...



## Full-Text index Enhancements

![Section 3](/blog/qdrant-1.15.x/section-3.png)

We don't want feature parity with Elasticsearch, but we want to include full-text features that improve Vector Search use-case.

Our intent is that new abilities will play in combination with vector search and extent it's usefulness, rather than be applied on their own.


### Match Any Condition for Text Search

This is technically not something that was not possible before, but now it is much more convenient to express.
Before it was like this:

```json
{
  "should": [
    { "match": { "text": "apple" } },
    { "match": { "text": "banana" } },
    { "match": { "text": "cherry" } }
  ]
}
```

now you can do:

```json
{
  "match": {
    "text_any": "apple banana cherry"
  }
}
```

When it can be used?

- In combination with vector search, as a pre-filtering condition, especially in batch with "Match All" conditions.


```
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

So we can fallback to less and less strict pre-filtering conditions in case of insufficient results.


### ASCII Folding - Improved Search for Multilingual Texts

ToDO: in short explain how it works and link to full docs.

Note: mention, that is was a outside contribution by community member.


## Conditional Updates

ToDo: mention idempotency, mention model migration use case.


## WEB UI Visual Upgrade


## Qdrant Edge - Beta Release


## Honorable Mentions

All other notable improvements in a list with links to further reading.

- RRF with configurable parameters.
- Metrics upgrade
- More perfrormance improvements & bug fixes, but we will know about them after changelog is out.


## Engage

![Engage](/blog/qdrant-1.15.x/section-4.png)
