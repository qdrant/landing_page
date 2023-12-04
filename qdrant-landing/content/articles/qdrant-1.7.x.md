---
title: "Qdrant 1.7.0 has just landed!"
short_description: "Qdrant 1.7.0 brought a bunch of new features. Let's take a closer look at them!"
description: "Sparse vectors, Discovery API, user-defined sharding, and snapshot-based shard transfer. That's what you can find in the latest Qdrant 1.7.0 release!"
social_preview_image: /articles_data/qdrant-1.7.x/social_preview.png
small_preview_image: /articles_data/qdrant-1.7.x/icon.svg
preview_dir: /articles_data/qdrant-1.7.x/preview
weight: -90
author: Kacper Łukawski
author_link: https://kacperlukawski.com
date: 2023-12-05T10:00:00Z
draft: false
keywords:
  - vector search
  - new features
  - sparse vectors
  - discovery
  - exploration
  - custom sharding
  - snapshot-based shard transfer
---

Please welcome the long-awaited [Qdrant 1.7.0 release](https://github.com/qdrant/qdrant/releases/tag/v1.7.0). Except for a handful of minor fixes and improvements, this release brings some cool brand-new features that we are excited to share! 
The latest version of your favorite vector search engine finally supports **sparse vectors**. That's the feature many of you requested, so why should we ignore it? 
We also decided to continue our journey with [vector similarity beyond search](/articles/vector-similarity-beyond-search/). The new Discovery API covers some completely new use cases. We're more than excited to see what you will build with it! 
But there is more to it! Check out what's new in **Qdrant 1.7.0**!

1. Sparse vectors: do you want to use BM25? Long-awaited support for sparse vectors is finally here!
2. Discovery API: a completely new way of using vectors for restricted search and exploration.
3. User-defined sharding: you can now decide which points should be stored on which shard.
4. Snapshot-based shard transfer: a new option for moving shards between nodes.

Do you see something missing? Your feedback drives the development of Qdrant, so do not hesitate to [join our Discord community](https://qdrant.to/discord) and help us build the best vector search engine out there!

## New features

Qdrant 1.7.0 brings a bunch of new features. Let's take a closer look at them!

### Sparse vectors

TODO: Describe the sparse vectors and use cases. We can just summarize it briefly here, and then announce the dedicated article.

### Discovery API

The newly introduced [Discovery API](/documentation/concepts/explore/#discovery-api) aims to enable even more scenarios for using vectors. Its interface is similar to the [Recommendation API](/documentation/concepts/explore/#recommendation-api), but it effectively constraints the search space.
There is a concept of `context`, which is a set of positive-negative pairs. Each pair divides the space into positive and negative zones. In that mode, the search operation prefers points based on how many positive zones they belong to (or how much they avoid negative zones).

The Discovery API can be used in two ways - either with or without the target point. The first case is called a **discovery search**, while the second is called a **context search**.

#### Discovery search

*Discovery search* is an operation that uses a target point to find the most relevant points in the collection, while performing the search in the preferred areas only. That is basically a search operation with more control over the search space.

![Discovery search visualization](/articles_data/qdrant-1.7.x/discovery-search.png)

Please refer to the [Discovery API documentation on discovery search](/documentation/concepts/explore/#discovery-search) for more details and the internal mechanics of the operation.

#### Context search

The mode of *context search* is similar to the discovery search, but it does not use a target point. Instead, the `context` is used to navigate the HNSW graph towards preferred zones. It is expected that the results in that mode will be diverse, and not centered around one point.
*Context search* might be an answer for those looking for some kind of exploration of the vector space. 

![Context search visualization](/articles_data/qdrant-1.7.x/context-search.png)

### User-defined sharding

Qdrant's collections are divided into shards. A single **shard** is a self-contained store of points, which can be moved between nodes. Up till now, the points were distributed among shards by using a consistent hashing algorithm, so that shards were managing non-intersecting subsets of points.
The latter one remains true, but now you can define your own sharding and decide which points should be stored on which shard. Sounds cool, right? But why would you need that? Well, there are multiple scenarios in which you may want to use custom sharding. For example, you may want to store some points on a dedicated node, or you may want to store points from the same user on the same shard.

While the old behavior is still the default one, you can now define the shards when you create a collection. Then, you can assign each point to a shard by providing a `shard_key` in the `upsert` operation. What's more, you can also search over the selected shards only by providing the `shard_key` parameter in the search operation.

```http request
POST /collections/my_collection/points/search
{
    "vector": [0.29, 0.81, 0.75, 0.11],
    "shard_key": ["cats", "dogs"],
    "limit": 10,
    "with_payload": true,
}
```

If you want to know more about the user-defined sharding, please refer to the [sharding documentation](/documentation/guides/distributed_deployment/#sharding).

### Snapshot-based shard transfer

That's a really more in depth technical improvement for the distributed mode users, but we implemented a new options the shard transfer mechanism. The new approach is based on the snapshot of the shard, which is transferred to the target node.

Moving shards is required for dynamical scaling of the cluster. Your data can migrate between nodes, and the way you move it is crucial for the performance of the whole system. The good old `stream_records` method (still the default one) transmits all the records between the machines and indexes them on the target node. 
That means, even the HNSW index has to be recreated every time you move the shard. The new `snapshot` approach is based on the snapshot, which is transferred to the target node. The snapshot contains all the data, even quantized if you use it, and the index, so the target node can just load it and start serving requests. 

There are multiple scenarios in which you may prefer one over the other. Please check out the docs of the [shard transfer method](/documentation/guides/distributed_deployment/#shard-transfer-method) for more details and head-to-head comparison. As for now, the old `stream_records` method is still the default one, but we may decide to change it in the future.

## Minor improvements

Except for the new features, Qdrant 1.7.0 improves and fixes some minor issues. Here is a list of the most important ones:

TODO: Put the list of issues here. Just copy the most important ones from the release notes.

## Release notes

[Our release notes](https://github.com/qdrant/qdrant/releases/tag/v1.7.0) are a place to go if you are interested in more details. Please remember that Qdrant is an open source project, so feel free to [contribute](https://github.com/qdrant/qdrant/issues)!
