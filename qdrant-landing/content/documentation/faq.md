---
title: Frequently Asked Questions
weight: 34
---

| FAQ Topics |  |  |   
|---|---|---|
| Qdrant Fundamentals | Database Optimization Strategies | Server Connection Issues |   

## Qdrant Fundamentals

### How many collections can I create?

You should create one collection and set it up for multitenancy. We believe that creating multiple collections is an anti-pattern, and we don't want to encourage it. Read more about [Multitenancy](https://qdrant.tech/documentation/tutorials/multiple-partitions/).

### Why are returned vectors null?

You can modify the scroll method to include the vectors by setting the with_vector parameter to True. If you're still seeing "vector": null in your point, it might be that the vector you're passing is not in the correct format, or there's an issue with how you're calling the upsert method.

### Does Qdrant support sparse vectors?

We have it in our roadmap, but currently, it’s not supported. We believe a hybrid search might be built with two separate tools combined. Read more about [our approach](https://qdrant.tech/articles/hybrid-search/) to hybrid search.  

### How to upload many vectors into Qdrant collection?

You should use batches and load the vectors iteratively. 

### Can I only store quantized vectors and discard the full precision vectors? 

Qdrant needs to retain the original vectors for internal purposes.

### When to use Kubernetes vs. Docker containers?

A: To run a multi node setup we recommend Kubernetes, but for a single node you can run Docker.  In general in production critical systems, we always advocate more nodes rather than one big one and activate replication for your collections. There are a lot of pros and cons of single installation versus Kubernetes and it very much depends on your use case.

## Database Optimization Strategies

### How do I reduce memory usage?

Quantization retains the original vector, but you can reduce the memory usage. Read more about leveraging the [Quantization](https://qdrant.tech/documentation/guides/quantization/) feature.

### How do I tune search accuracy while controlling for memory usage?

Accuracy tuning tips show you how to adjust quantile parameters and rescoring. Get some helpful tips [here](https://qdrant.tech/documentation/guides/quantization/#quantization-tips)

### How do I measure memory requirements?

Read more about the minimal RAM required to serve vectors with Qdrant. Read more about [Memory Consumption](https://qdrant.tech/articles/memory-consumption/).

### How to optimize speed search while retaining low memory use?

Use Vector Quantization or disable rescoring. Both will reduce disk reads. Read more about [optimizing Qdrant](https://qdrant.tech/documentation/tutorials/optimize).

### How to avoid issues when updating to the latest version?

We only guarantee compatibility if you update between consequent versions. You would need to upgrade versions one at a time 1.1 -> 1.2 then 1.2 -> 1.3 then 1.3 -> 1.4.

### Do you guarantee compatibility across versions?
In case your version is older, we guarantee only compatibility between two consecutive minor versions.
While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.

### My database fails and memory usage is high. 

Measuring memory consumption with htop or other tools won't provide accurate numbers. Test by limiting memory instead and see when it fails.

## Server Connection Issues

### What I have a timeout during a batch upsert?

The easiest fix would be to set max_retries to a higher value and set the timeout higher as well when you instantiate QdrantClient. However, we also recommend keeping the entire batch size (including vector & payload) under 5MB.

### I have too many vectors and I can’t upload them all to RAM.

Directly writing to disk is a lot faster when doing a huge upload batch.You want to use memmap support. During collection creation, memmap may be enabled on a per-vector basis using the on_disk parameter. This will store vector data directly on disk. Read more about [configuring mmap storage](https://qdrant.tech/documentation/concepts/storage/#configuring-memmap-storage).

### The server stopped responding via HTTP. 

If you indexed a large number of points and there is not response, try debugging. If no information is available in debug.

### Qdrant Docker fails to start repeatedly on Ubuntu 20.04 

We are currently finding there are permissions issues with Docker.
https://github.com/qdrant/qdrant/issues/2149

