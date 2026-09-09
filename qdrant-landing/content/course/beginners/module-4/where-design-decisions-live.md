---
title: "Where Design Decisions Live"
short_description: "Module 4 of the Beginner Course: the five layers of a vector search system, ordered by cost to change."
description: "A vector search system has five layers, ordered from easiest to hardest to change. Learn which decisions you can revise and which force a rebuild."
weight: 2
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# Where Design Decisions Live

A vector search system has five layers. The first four go from easiest to hardest to change. Distribution is separate, because its cost depends on which change you make, and [Growing Past One Machine](/course/beginners/module-4/growing-past-one-machine/) covers it.

![The five layers of a vector search system as stacked rows. Four sit on a shaded scale from easiest to hardest to change: Query, holding query embedding, dense and sparse search, fusion, and top-K; Indexing, holding the HNSW graph and payload indexes; Storage, holding quantization and on-disk storage; and Data, holding chunking, the embedding model, and the payload schema. Distribution, holding sharding and replication, sits below in a dashed group because what a change costs there depends on the operation.](/courses/beginners/module-4/layers.png)

**Query** handles each request: embed the query, search dense vectors, sparse vectors, or both, then combine the ranked lists into the top-K results. Module 3 covered this layer. If the query is wrong, change it and run it again. The [Query API](/documentation/search/search/) covers every form a query can take.

**Indexing** contains the structures that make search fast. Qdrant builds two of them: the HNSW graph over your vectors, from Module 2, and a payload index over each field you filter on. A mistake here leaves the results correct and makes them slow, and rebuilding the index fixes it. [Indexing](/documentation/manage-data/indexing/) covers how to configure both.

**Storage** controls whether points live in memory or on disk, and therefore how much memory you need. The two main levers are [quantization](/documentation/manage-data/quantization/), which compresses each vector into fewer bytes, and [on-disk vectors](/documentation/manage-data/storage/#configuring-memmap-storage), which keep them in files instead. Both are collection configuration changes, and on an existing collection both rewrite every vector.

**Data** includes the content and the decisions made before it reaches Qdrant. No layer above can fix a mistake here, so the only fix is ingesting the data again. [Decide Before You Ingest](/course/beginners/module-4/decide-before-you-ingest/) works through all four: the text you embed, the model that embeds it, the chunk size, and the payload fields. [Vectors](/documentation/manage-data/vectors/) and [Payload](/documentation/manage-data/payload/) cover what a point can hold.

**Distribution** spreads a collection across more than one machine, through sharding and replication. [Growing Past One Machine](/course/beginners/module-4/growing-past-one-machine/) covers this layer, and [Distributed Deployment](/documentation/distributed_deployment/) has the mechanics.
