---
title: Fundamentals
weight: 1
---

## Qdrant Fundamentals

### How many collections can I create?

You should create one collection and set it up for multitenancy. We believe that creating multiple collections is an anti-pattern, and we don't want to encourage it. Read more about [Multitenancy](../../tutorials/multiple-partitions/).

### Why are returned vectors null?

You can modify the scroll method to include the vectors by setting the with_vector parameter to True. If you're still seeing "vector": null in your point, it might be that the vector you're passing is not in the correct format, or there's an issue with how you're calling the upsert method.

### How can I retrieve records based on filters only?

We do not allow `search`  with `vector=None`. In Qdrant, "search" means similarity search for vectors. If you want to do query without vectors, we have specialized functions for it. for instance with the `scroll` method, you can retrieve the records based on filters only. [Read more about scrolling here](../../concepts/points/#scroll-points).

### Does Qdrant support sparse vectors?

We have it in our roadmap, but currently, it’s not supported. We believe a hybrid search might be built with two separate tools combined. Read more about [our approach](../../../articles/hybrid-search/) to hybrid search.  

### Is there a way to recover the entire storage?

There is no endpoint for restoring the full storage?
Instead, this can be done when starting Qdrant through the command line.

### How do I upload a large number of vectors into a Qdrant collection?

You should use batches and load the vectors iteratively. 

### Can I only store quantized vectors and discard full precision vectors? 

Qdrant needs to retain the original vectors for internal purposes.

### When should I use Kubernetes vs. Docker containers?

To run a multi node setup we recommend Kubernetes, but for a single node you can run Docker.  In general in production critical systems, we always advocate more nodes rather than one big one and activate replication for your collections. There are a lot of pros and cons of single installation versus Kubernetes and it very much depends on your use case.

## Qdrant Cloud

### Is it possible to scale down a Qdrant Cloud cluster?

In Qdrant Cloud scale downs are not possible at the moment.

### Uploading snapshots via dashboard fails. 

If you recover data from snapshot through the dashboard and uploading fails, then you might be experiencing a bug.

Please try to recover via the CLI.

