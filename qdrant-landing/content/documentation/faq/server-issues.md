---
title: Server Issues
weight: 2
---

## Server Connection Issues

### What if I have a timeout during a batch upsert?

The easiest fix would be to set max_retries to a higher value and set the timeout higher as well when you instantiate QdrantClient. However, we also recommend keeping the entire batch size (including vector & payload) under 5MB.

### I have too many vectors and I can’t upload them all to RAM.

Directly writing to disk is a lot faster when doing a huge upload batch.You want to use memmap support. During collection creation, memmap may be enabled on a per-vector basis using the on_disk parameter. This will store vector data directly on disk. Read more about [configuring mmap storage](../../concepts/storage/#configuring-memmap-storage).

### The server stopped responding via HTTP. 

If you indexed a large number of points and there is not response, try debugging. If no information is available in debug.

### Qdrant Docker fails to start repeatedly on Ubuntu 20.04 

We are currently finding there are permissions issues with Docker.
https://github.com/qdrant/qdrant/issues/2149
