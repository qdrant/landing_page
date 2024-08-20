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

## Data Structures 101

Those who took programming courses might remember that there is no such thing as a universal data structure.
Some structures are good at accessing elements by index (like arrays), while others shine in terms of insertion efficiency (like linked lists).

However, when we move from theoretical data structures to real-world systems, and particularly in performance-critical areas such as vector search, things become more complex. [Big-O notation](https://en.wikipedia.org/wiki/Big_O_notation) provides a good abstraction, but it doesn’t account for the realities of modern hardware: cache misses, memory layout, disk I/O, and other low-level considerations that influence actual performance.

> From the perspective of hardware efficiency, the ideal data structure is a contiguous array of bytes that can be read sequentially in a single thread. This scenario allows hardware optimizations like prefetching, caching, and branch prediction to operate at their best.

However, real-world use cases require more complex structures to perform varios operations like insertion, deletion, and search.
These requirements increase complexity and introduce performance trade-offs.

### Mutability

One of the most significant challenges when working with data structures is ensuring mutability — the ability to change the data structure after it’s created, particularly with fast update operations.

Let’s consider a simple example: we want to iterate over items in sorted order.
Without a mutability requirement, we can use a simple array and sort it once. 
This is very close to our ideal scenario. We can even put the structure on disk - this is trivial for an array.

However, if we need to insert an item into this array, **things get more complicated**. 
Inserting into a sorted array requires shifting all elements after the insertion point, which leads to linear time complexity for each insertion, which is not acceptable for many applications.

To handle such cases, more complex structures like [B-trees](https://en.wikipedia.org/wiki/B-tree) come into play. B-trees are specifically designed to optimize both insertion and read operations for large data sets. However, they sacrifice the raw speed of array reads for better insertion performance.

Here’s a benchmark that illustrates the difference between iterating over a plain array and a BTreeSet in Rust:

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

Vector Search engines, like Qdrant, have to deal with a large variety of data structures. 
If we could make them immutable, it would significantly improve performance and optimize memory usage.

## What immutability can improve exactly?

A large part of the immutable advantage comes from the fact that we know the exact data we need to put into the structure even before we start building it.
The simplest example is a sorted array: we would know exactly how many elements we have to put into the array so we can allocate the exact amount of memory once.

More complex data structures might require additional statistics to be collected before the structure is built.
A qdrant-related example of this is Scalar Quantization: in order to select proper quantization levels, we have to know the distribution of the data.

(Image with quatiles here)

Computing this distribution requires knowing all the data in advance, but once we have it, applying scalar quantization is a simple operation.

Let's take a look at a non-exhaustive list of data structures and potential improvements we can get from making them immutable:

|Function| Mutable Data Structure | Immutable Alternative | Potential improvements |
|----|------|------|------------------------|
| Read by index | Arrray | Fixed chunk of memory | Allocate exact amount of memory |
| Vector Storage | Array or Arrays | Memory-mapped file | Offload data to disk |
| Read sorted ranges| B-Tree | Sorted Array | Store all data close, avoid cache misses |
| Read by key | Hash Map | Hash Map with Perfect Hashing | Avoid hash collisions |
| Get documents by keyword | Inverted Index | Inverted Index with Sorted </br> and BitPacked Postings | Less memory usage, faster search |
| Vector Search | HNSW graph | HNSW graph with </br> payload-aware connections | Better precision with filters |
| Tenant Isolation | Vector Storage | Defragmented Vector Storage | Faster access to on-disk data |


For more info on payload-aware connections in HNSW, read our [previous article](/articles/filtrable-hnsw/).

This time around, we will focus on the latest additions to Qdrant: 
- **the immutable hash map with perfect hashing** 
- **defragmented vector storage**.

### Perfect Hashing

ToDo: Here describe how hash table with perfect hashing works and why it is important (see notion for details)


### Defragmentation

* Describe how, why and when it is useful
  * Disk is accessed by pages
  * If page is bigger than vector, we waste cache
  * If all relevant vectors for the tenant are together, we don't have cache misses even if vectors are small

![defragmentation](/articles_data/immutable-data-structures/defragmentation.png)

## Updating Immutable Data Structures

ToDo.

Basically, two ideas:

- Copy-on-write
- Soft-delete

Also, it might be interesting to describe segments and how we can write to the segment, which is currently under optimization (and have to be read-only).

## Downsides and How to Compensate

While immutable data structures are great for read-heavy operations, they come with trade-offs:

- **Higher update costs:** Immutable structures are less efficient for updates. The amortized time complexity might be the same as mutable structures, but the constant factor is higher.
- **Rebuilding overhead:** In some cases, we may need to rebuild indices or structures for the same data more than once.
- **Read-heavy workloads:** Immutability assumes a search-heavy workload, which is typical for search engines but not for all applications.

In Qdrant, we mitigate these downsides by allowing the user to adapt the system to their specific workload. 
For example, changing the default size of the segment might help to reduce the overhead of rebuilding indices.

In extreme cases, multi-segment storage can act as a single segment, falling back to the mutable data structure when needed.

## Conclusion

Immutable data structures, while tricky to implement correctly, offer significant performance gains, especially for read-heavy systems like search engines. They allow us to take full advantage of hardware optimizations, reduce memory overhead, and improve cache performance.

In Qdrant, the combination of techniques like perfect hashing and defragmentation brings further benefits, making our vector search operations faster and more efficient. While there are trade-offs, the flexibility of Qdrant’s architecture — including segment-based storage — allows us to balance the best of both worlds.





