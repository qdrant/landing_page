---
title: "Immutable Data Structures for Superior Vector Search Performance"
short_description: "Learn how immutable data structures improve vector search performance in Qdrant."
description: "Learn about the advantages of immutability, perfect hashing and defragmentation. Our new approach carries great potential for large-scale search systems."
social_preview_image: /articles_data/immutable-data-structures/social_preview.png
preview_dir: /articles_data/immutable-data-structures/preview
weight: -200
author: Andrey Vasnetsov
date: 2024-08-16T09:45:00+02:00
draft: false
keywords:
  - data structures
  - optimization
  - immutable data structures
---

## Does the Ideal Data Structure Exist?

Those who took programming courses might remember that there is no such thing as a universal data structure. Some structures are excellent at accessing elements by index (like arrays), while others shine in terms of insertion efficiency (like linked lists).

However, when we move from theoretical data structures to real-world systems, and particularly in performance-critical areas such as vector search, things become more complex. [Big-O notation](https://en.wikipedia.org/wiki/Big_O_notation) provides a good abstraction, but it doesn’t account for the realities of modern hardware: cache misses, memory layout, disk I/O, and other low-level considerations that influence actual performance.

> From the perspective of hardware efficiency, the ideal data structure is a simple, contiguous array of bytes that can be read sequentially in a single thread. This scenario allows hardware optimizations like prefetching, caching, and branch prediction to operate at their best.

However, real-world use cases require more complex structures to meet various operational needs, like mutability, efficient insertions, and indexing. These requirements increase complexity and introduce performance trade-offs, particularly in the case of mutability.

### Mutability: Trading Performance for Flexibility

One of the most significant challenges when working with data structures is ensuring mutability — the ability to change the data structure after it’s created, particularly with fast update operations.

Let’s consider a simple example: we want to maintain a list of items that can be accessed in sorted order. Without mutability, we could simply use an array and sort it once, leading to very efficient reads. The array could even be memory-mapped to disk, making it highly space-efficient.

However, if we need to insert an item into this array, **things get more complicated**. Inserting into a sorted array requires shifting all elements after the insertion point, which leads to linear time complexity for each insertion. This might be tolerable in memory, but it becomes problematic when dealing with disk-based storage.

To handle such cases, more complex structures like [B-trees](https://en.wikipedia.org/wiki/B-tree) come into play. B-trees are specifically designed to optimize both insertion and read operations for large data sets, especially on disk. However, they sacrifice the raw speed of array reads for better insertion performance.

Here’s a benchmark that illustrates the difference between a plain array and a B-tree in Rust.</br> This example shows that B-trees, although necessary for mutable sorted collections, **can significantly slow down read operations compared to arrays**. Therefore, we often aim to minimize mutability in search engines like Qdrant.

```rust
use std::collections::BTreeSet;
use rand::Rng;

fn main() {
    // Benchmark plain vector VS btree in a task of iteration over all elements
    let mut rand = rand::thread_rng();
    let vector: Vec<_> = (0..1000000).map(|_| rand.gen::<u64>()).collect();
    let btree: BTreeSet<_> = vector.iter().copied().collect();

    {
        let mut sum = 0;
        for el in vector {
            sum += el;
        }
    } // Elapsed: 850.924µs

    {
        let mut sum = 0;
        for el in btree {
            sum += el;
        }
    } // Elapsed: 5.213025ms, ~6x slower

}
```

## Why Immutability Helps

Making data structures immutable can unlock significant performance optimizations, especially for read-heavy workloads like those in search engines. When a data structure is immutable, **you know the exact shape and size of the data in advance**, allowing you to optimize memory allocation and avoid costly update operations.

Consider a sorted array, for example. When building the array immutably, we can allocate the exact amount of memory upfront and ensure that all data resides in contiguous memory. This avoids cache misses during reads and makes the structure highly efficient to traverse.

Immutability also enables the use of advanced techniques like [memory-mapped files](https://en.wikipedia.org/wiki/Memory-mapped_file), where data can be stored on disk but treated as if it resides in memory. This makes large datasets manageable and ensures minimal memory usage.

## Immutability in Qdrant: Scalar Quantization

In Qdrant, one example of the benefits of immutability is the [scalar quantization](/articles/scalar-quantization/) technique. Scalar quantization is used to reduce the memory footprint of vector data by encoding it into a smaller representation. To apply this technique effectively, we need to know the distribution of the data upfront, which is only possible with immutable data.

Here’s how it works:

1. **Data distribution:** We collect dataset statistics: min, max, and distribution of vector magnitudes.
2. **Quantization levels:** Based on this distribution, we compute the optimal quantization levels.
3. **Encoding:** Once quantization levels are established, we apply them to the entire dataset.

(Image with quatiles here)

This is a computationally expensive process, but it only needs to be done once. 

> If the dataset were mutable, we would need to repeat this process with every update, drastically increasing overhead.

## Immutability in Practice: Data Structure Improvements

Here’s a more concrete look at how immutability improves specific data structures used in vector search engines:

| Function | Mutable Data Structure | Immutable Alternative | Potential Improvements |
|---|---|---|---|
| **Read by index** | Dynamic Array | Static Array | Memory allocation can be optimized for read-heavy operations, avoiding overhead of resizing. |
| **Vector Storage** | Array of Arrays | Memory-mapped file | Memory offloading to disk saves RAM and improves cache performance. |
| **Read sorted ranges** | B-Tree | Sorted Array | Contiguous memory minimizes cache misses and improves read speed. |
| **Read by key** | Hash Map | Perfect Hash Map | Immutable hash maps can be optimized with **perfect hashing** to avoid collisions, improving lookup time. |
| **Keyword Search** | Inverted Index | Inverted Index with Bit-Packed Postings | Immutability allows efficient compression of index data, reducing memory footprint and boosting search speed. |
| **Vector Search** | HNSW Graph | HNSW Graph with Payload-Aware Connections | Immutable graph structures improve precision in filtered vector search. |
| **Tenant Isolation** | Fragmented Vector Storage | Defragmented Vector Storage | Placing vectors for a tenant contiguously reduces disk I/O and cache misses. |

For more info on payload-aware connections in HNSW, read our [previous article](/articles/filtrable-hnsw/).

This time around, we should focus on the latest additions to Qdrant: 
- **the immutable hash map with perfect hashing** 
- **defragmented vector storage**.

### Key Techniques: Perfect Hashing and Defragmentation

**Perfect Hashing:** This method allows us to create a hash function that maps keys to unique indices without collisions. This is extremely useful for search engines, where lookup speed is critical. With perfect hashing, we eliminate the overhead of handling collisions, making searches faster and more predictable.

A hash table with perfect hashing is built in two steps:

1. **First-level hashing:** We assign each key to a bucket using a standard hash function.
2. **Second-level hashing:** For each bucket, we create a secondary hash function that ensures no collisions within the bucket.

This two-level hashing guarantees constant time complexity for lookups.

**Defragmentation:** In large-scale systems like vector search engines, defragmentation becomes crucial when storing data on disk. Disk access is page-based, and when vectors are scattered across different pages, it leads to wasted space and cache inefficiencies.

By defragmenting storage, we ensure that vectors belonging to the same tenant or query are stored contiguously. This reduces cache misses and ensures that disk pages are used efficiently.

![defragmentation](/articles_data/immutable-data-structures/defragmentation.png)

## Updating Immutable Data Structures

Immutability raises a natural question: How do we handle updates? The two primary techniques are copy-on-write and soft-delete.

### Copy-on-Write:

With this method, rather than modifying the data structure directly, we create a new copy with the updated data. The downside is increased memory usage, but it avoids complex locking mechanisms and maintains immutability.

### Soft-Delete:

When removing data, rather than physically deleting it from the structure, we mark it as deleted. This allows for efficient handling of deletes while keeping the data structure immutable.

**Also, it might be interesting to describe segments and how we can write to the segment, which is currently under optimization (and have to be read-only).**

## Downsides and How to Compensate

While immutable data structures are great for read-heavy operations, they come with trade-offs:

- **Higher update costs:** Immutable structures are less efficient for updates. The amortized time complexity might be the same as mutable structures, but the constant factor is higher.
- **Rebuilding overhead:** In some cases, we may need to rebuild indices or structures for the same data more than once.
- **Read-heavy workloads:** Immutability assumes a search-heavy workload, which is typical for search engines but not for all applications.

In Qdrant, we mitigate these downsides with a hybrid approach: segmenting data. Immutable structures handle the bulk of read operations, but we can fall back on mutable structures for data that is frequently updated.

## Conclusion

Immutable data structures, while tricky to implement correctly, offer significant performance gains, especially for read-heavy systems like search engines. They allow us to take full advantage of hardware optimizations, reduce memory overhead, and improve cache performance.

In Qdrant, the combination of techniques like perfect hashing and defragmentation brings further benefits, making our vector search operations faster and more efficient. While there are trade-offs, the flexibility of Qdrant’s architecture — including segment-based storage — allows us to balance the best of both worlds.





