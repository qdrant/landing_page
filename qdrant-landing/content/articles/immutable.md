---
title: "Qdrant internals: immutable data structures"
short_description: "How immutability helps Qdrant do vector search blazingly fast"
description: "How immutability helps Qdrant do vector search blazingly fast"
social_preview_image: /articles_data/immutable/social_preview.png
preview_dir: /articles_data/immutable/preview
weight: -200
author: Andrey Vasnetsov
date: 2024-08-01T09:45:00+02:00
draft: false
keywords:
  - data structures
  - optimization
  - immutable data structures
---

## Data Structures 101

You know from your freshman year that there is no such thing as a universal data structure.
Some data structures are really good at providing access to elements by their index (like arrays), while others have a better insertion complexity (like linked lists).

Everything becomes even more complicated when you start thinking about program execution in real harware.
Big-O notation suddenly becomes irrelevant, if you have to deal with cache misses, memory layout, and other low-level stuff.

From the hardware perspective, the best data structure we can have is a simple contiguous array of bytes, which is being read sequentially in a single thread.
In this scenario all optimization mechanisms work perfectly: prefetching, caches, branch prediction and so on.

The further we go from this ideal scenario, the more we have to pay for the complexity of our data structures.
And the complexity is the result of additional requirements we set for our data structures.

### Mutability

One of the most challenging requirements is ability to change the data structure after it was created.
Especially, if the update operation is supposed to be fast.

Consider a simple example: we need want to have an ability to iterate over items in sorted order.
Without a mutability requirement, we can use a simple array and sort it once. 
This is very close to our ideal scenario. We can even put the structure on disk - this is trivial for an array.

But if we would want to insert an element into this array, we would have to shift all elements after the insertion point.
The time complexity of this operation is linear, and it is not acceptable for many applications.

The alternative data structure, suitable for this task, is a B-tree. 
Much more complex structure, which has to sacrifice efficiency of read operations to provide fast insertions.

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

Vector Search engines, like Qdrant, have to deal with a large variety of data structures, but all of them have one thing in common: 
if we could make them immutable, it could significantly help us to improve performance and optimize memory usage.

## What immutability can improve exactly?

Large part of immutable advantage comes from the fact, that we know the exact data we need to put into the structure even before we start building it.
Simplest example is a sorted array: we would know exactly how many elements we have to put into the array, so we can allocate exact amount of memory once.

More complex data structures might require additional statistics to be collected before the structure is built.
Qdrant-related example of this is Scalar Quantization: on order to select proper quantization levels, we have to know the distribution of the data.

(Image with quatiles here)

Computing this distribution is requires knowing all the data in advance, but once we have it, applying scalar quantization is a simple operation.

Let's take a look at non-exhaustive list of data structures and potential improvements we can get from making them immutable:

|Function| Mutable Data Structure | Immutable Alternative | Potential improvements |
|----|------|------|------------------------|
| Read by index | Arrray | Fixed chunk of memory | Allocate exact amount of memory |
| Vector Storage | Array or Arrays | Memory-mapped file | Offload data to disk |
| Read sorted ranges| B-Tree | Sorted Array | Store all data close, avoid cache misses |
| Read by key | Hash Map | Hash Map with Perfect Hashing | Avoid hash collisions |
| Get documents by keyword | Inverted Index | Inverted Index with Sorted </br> and BitPacked Postings | Less memory usage, faster search |
| Vector Search | HNSW graph | HNSW graph with </br> paylaod-aware connections | Better precision with filters |
| Tenant isolation | Vector Storage | Defragmented Vector Storage | Faster access to on-disk data |

About payload-aware connections in HNSW you can read in our [previous article](/articles/filtrable-hnsw/).

But in this article I would like to describe a few of the latest additions to Qdrant: immutable hash map with perfect hashing and defragmented vector storage.

### Perfect Hashing

ToDo: Here describe how hash table with perfect hashing works and why it is important (see notion for details)

### Deftagmentation

ToDo

* Describe why and when it is useful
  * Disk is accessed by pages
  * If page is bigger than vector, we waste cache
  * If all relevant vectors for the tenant are together, we don't have cache misses even if vectors are small

(Use image with defragmentation here)


## How to update immutable data structures?

ToDo.

Basically, two ideas:

- Copy-on-write
- Soft-delete

Also might we interesting to describe segments and how we can write to the segment, which is currently under optimization (and have to be read-only).

## Downsides and how to compensate them

* Immutable data structures are less efficient for updates, amortized complexity is the same, but constant factor is higher. Sometimes we need to build index twice for the same data.
* Immutable data structures assume read (search) heavy workload, which is expected for search engines.
* With segments it is possible to fallback to mutable data structures, so abitily to have immutable storage is more generic and flexible, than just mutable storage.
