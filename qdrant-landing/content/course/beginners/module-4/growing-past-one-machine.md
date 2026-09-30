---
title: "Growing Past One Machine"
short_description: "Module 4 of the Beginner Course: when sharding and replication are worth their cost."
description: "Sharding splits a collection across nodes and replication survives losing one. Learn when each is worth adding, and why tuning usually comes first."
weight: 5
isLesson: true
---

{{< date >}} Module 4 {{< /date >}}

# Growing Past One Machine

Most systems never need more than one node. **Sharding** splits a collection's points across nodes, so each node holds a slice. **Replication** keeps a copy of each shard on more than one node, so search survives losing one.

Use them when one node cannot hold the collection, or when search must continue after a node fails. The two differ in what they cost to add: a replica is usually a live change, while resharding an existing collection moves data. If search is slow, measure and tune the index before adding nodes. Adding nodes costs more, and it will not make an unindexed filter faster. [Distributed Deployment](/documentation/distributed_deployment/) covers both.
