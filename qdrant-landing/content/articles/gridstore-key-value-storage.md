---
title: "Introducing GridStore: Qdrant's Custom Key-Value Store"
short_description: "Why and how we built our own key-value store."
description: "Why and how we built our own key-value store. A short technical report on our procedure and results."
preview_dir: /articles_data/gridstore-key-value-storage/preview
social_preview_image: /articles_data/gridstore-key-value-storage/social_preview.png
weight: -150
author: Luis Cossio, Arnaud Gourlay & David Myriel
date: 2025-02-01T00:00:00.000Z
category: qdrant-internals
---

## Why We Built Our Own Storage Engine

Databases need a place to store and retrieve data. That’s what Qdrant's [**key-value storage**](https://en.wikipedia.org/wiki/Key–value_database) does—it links keys to values.

When we started Qdrant, we chose [**RocksDB**](https://rocksdb.org) as our embedded key-value store.
<div style="text-align: center;">
  <img src="/articles_data/gridstore-key-value-storage/rocksdb.jpg" alt="RockdSB" style="width: 50%;">
  <p>It was fast, reliable, and well-documented.</p>
</div>

Over time, we ran into issues. It handled generic keys, while we only used sequential IDs. Its architecture required compaction, which caused random latency spikes. Tuning it was a headache. And working with C++ slowed us down.

We needed something better because nothing out there fit our needs. We didn’t require generic keys. We wanted full control over when data was written. Our system already had crash recovery. Compaction wasn’t a priority. Debugging misconfigurations was not a great use of our time.

So we built our own. Simple, efficient, and designed just for Qdrant.
<div style="text-align: center;">
  <img src="/articles_data/gridstore-key-value-storage/gridstore.png" alt="GridStore" style="width: 50%;">
  <p>A completely custom key-value store.</p>
</div>

**Our first challenge?** Figuring out the best way to handle sequential keys and variable-sized data.

## GridStore Architecture: Three Main Components
![gridstore](/articles_data/gridstore-key-value-storage/gridstore-2.png)

GridStore’s architecture is built around three key components that enable fast lookups and efficient space management:
| Component                  | Description                                                                                   |
|----------------------------|-----------------------------------------------------------------------------------------------|
| The Data Layer                 | Stores values in fixed-sized blocks and retrieves them using a pointer-based lookup system.    |
| The Mask Layer                 | Uses a bitmask to track which blocks are in use and which are available.                      |
| The Region Gap Layer | Manages block availability at a higher level, allowing for quick space allocation.            |

### 1. The Data Layer for Fast Retrieval
At the core of GridStore is **The Data Layer**, which is designed to retrieve values quickly based on their keys. This structure allows for both efficient reads and a simple method of appending new values.

Instead of scanning through an index, GridStore stores keys in a structured array of pointers, where each pointer tells the system exactly where a value starts and how long it is. 

{{< figure src="/articles_data/gridstore-key-value-storage/architecture-1.png" alt="The Data Layer" caption="The Data Layer uses an array of pointers to quickly retrieve data." >}}

This makes lookups incredibly fast. For example, finding key 3 is just a matter of jumping to the third position in the pointer array and reading the value. 

However, because values are of variable size, the data itself is stored in fixed-sized blocks, which are grouped into larger page files. When inserting a value, GridStore allocates one or more consecutive blocks to store it, ensuring that each block only holds data from a single value. 

### 2. The Bitmask Layer for Efficient Updates
**The Bitmask Layer** helps GridStore handle updates and deletions without the need for expensive data compaction. Instead of maintaining complex metadata for each block, GridStore tracks usage with a bitmask, where each bit represents a block, with 1 for used, 0 for free.  

{{< figure src="/articles_data/gridstore-key-value-storage/architecture-2.png" alt="The Bitmask Layer" caption="The bitmask efficiently tracks update/delete usage." >}}

This makes it easy to determine where new values can be written. When a value is deleted, its pointer is removed, and the corresponding blocks in the bitmask are marked as available. Similarly, when updating a value, the new version is written elsewhere, and the old blocks are freed.

This approach ensures that GridStore doesn’t waste space, but as the storage grows, scanning large bitmasks for available blocks can become computationally expensive.

### 3. The Region Gap Layer for Effective Storage
To further optimize space management, GridStore introduces **The Region Gap Layer**, which provide a higher-level view of block availability. 

Instead of scanning the entire bitmask, GridStore groups blocks into regions and keeps track of the largest contiguous free space within each region, known as a **The Region Gap**. By also storing the leading and trailing gaps of each region, the system can efficiently combine multiple regions when needed for storing large values. 

{{< figure src="/articles_data/gridstore-key-value-storage/architecture-3.png" alt="The Region Gap Layer" caption="Complete architecture Wwth the Region Gap Layer." >}}

This layered approach allows GridStore to locate available space quickly, reducing the need for large-scale scans while keeping memory overhead minimal. With this system, finding storage space for new values requires scanning only a tiny fraction of the total metadata, making updates and insertions highly efficient.

## GridStore in Production: Maintaining Data Integrity 
![gridstore](/articles_data/gridstore-key-value-storage/gridstore-1.png)

GridStore’s architecture introduces multiple interdependent structures that must remain in sync to ensure data integrity:
- **The Data Layer** associates each key with its location in storage, including page ID, block offset, and block count.
- **The Bitmask Layer** keeps track of which blocks are occupied and which are free.
- **The Gap Region Layer** provides an indexed view of free blocks for efficient space allocation.

Every time a new value is inserted or an existing value is updated, all these components need to be modified in a coordinated way.

### When Things Break in Real Life
However, real-world systems don’t operate in a vacuum. Failures happen: software bugs cause unexpected crashes, memory exhaustion forces processes to terminate, disks fail to persist data reliably, and power losses can interrupt operations at any moment. 

*The critical question is: what happens if a failure occurs while updating these structures?*

If one component is updated but another isn’t, the entire system could become inconsistent. Worse, if an operation is only partially written to disk, it could lead to orphaned data, unusable space, or even data corruption.

### Stability Through Idempotency: Recovering With WAL
To guard against these risks, GridStore relies on a [Write-Ahead Log (WAL)](/documentation/concepts/storage/). Before committing an operation, Qdrant ensures that it is at least recorded in the WAL. If a crash happens before all updates are flushed, the system can safely replay operations from the log. 

This recovery mechanism introduces another essential property: [**idempotency**](https://en.wikipedia.org/wiki/Idempotence). 

The storage system must be designed so that reapplying the same operation after a failure leads to the same final state as if the operation had been applied just once.

### The Grand Solution: Lazy Updates
To achieve this, **GridStore completes updates lazily**, prioritizing the most critical part of the write: the data itself. 
|                                                                                                                |
|-----------------------------------------------------------------------------------------------------------------------------|
| 👉 Instead of immediately updating all metadata structures, it writes the new value first while keeping pending changes in memory. |
| 👉 The system only finalizes these updates when explicitly requested, ensuring that a crash never results in marking data as deleted before the update has been safely persisted. |
| 👉 In the worst-case scenario, GridStore may need to write the same data twice, leading to minor space overhead, but it will never corrupt the storage by overwriting valid data. |

## How We Tested the Final Product 
![gridstore](/articles_data/gridstore-key-value-storage/gridstore-3.png)

### First - Simple Model Testing 

GridStore can be tested efficiently using model testing, which compares its behavior to a simple in-memory hash map. Since GridStore should function like a persisted hash map, this method quickly detects inconsistencies.

The process is straightforward:
1. Initialize a GridStore instance and an empty hash map.
2. Run random operations (put, delete, update) on both.
3. Verify that results match after each operation.
4. Compare all keys and values to ensure consistency.

This approach provides high test coverage, exposing issues like incorrect persistence or faulty deletions. Running large-scale model tests ensures GridStore remains reliable in real-world use.

Here is a naive way to generate operations in Rust.

```rust

enum Operation {
    Put(PointOffset, Payload),
    Delete(PointOffset),
    Update(PointOffset, Payload),
}

impl Operation {
    fn random(rng: &mut impl Rng, max_point_offset: u32) -> Self {
        let point_offset = rng.random_range(0..=max_point_offset);
        let operation = rng.gen_range(0..3);
        match operation {
            0 => {
                let size_factor = rng.random_range(1..10);
                let payload = random_payload(rng, size_factor);
                Operation::Put(point_offset, payload)
            }
            1 => Operation::Delete(point_offset),
            2 => {
                let size_factor = rng.random_range(1..10);
                let payload = random_payload(rng, size_factor);
                Operation::Update(point_offset, payload)
            }
            _ => unreachable!(),
        }
    }
}
```
Model testing is a high-value way to catch bugs, especially when your system mimics a well-defined component like a hash map. If your storage behaves predictably, this method is a no-brainer.

We could have tested against RocksDB, but speed mattered more. A simple hash map let us run massive test sequences quickly, exposing issues faster.

For even sharper debugging, Property-Based Testing adds automated test generation and shrinking. It pinpoints failures with minimal test cases, making bug hunting faster and more effective.

### Crash Testing: Can GridStore Handle the Pressure?

Designing for crash resilience is one thing, and proving it works under stress is another. To push Qdrant’s data integrity to the limit, we built [**Crasher**](https://github.com/qdrant/crasher), a test bench that brutally kills and restarts Qdrant while it handles a heavy update workload.

Crasher runs a loop that continuously writes data, then randomly crashes Qdrant. On each restart, Qdrant replays its [**Write-Ahead Log (WAL)**](/documentation/concepts/storage/), and we verify if data integrity holds. Possible anomalies include:
- Missing data (points, vectors, or payloads)
- Corrupt payload values

This aggressive yet simple approach has uncovered real-world issues when run for extended periods. While we also use chaos testing for distributed setups, Crasher excels at fast, repeatable failure testing in a local environment.

## Testing GridStore Performance: Benchmarks
![gridstore](/articles_data/gridstore-key-value-storage/gridstore-4.png)

To measure the impact of our new storage engine, we used [**Bustle, a key-value storage benchmarking framework**](https://github.com/jonhoo/bustle), to compare GridStore against RocksDB. We tested three workloads:

| Workload Type                | Operation Distribution            |
|------------------------------|-----------------------------------|
| Read-heavy                   | 95% reads                         |
| Insert-heavy                 | 80% inserts                       |
| Update-heavy                 | 50% updates  

#### The results speak for themselves:

Average latency for reads, inserts and updates is lower across the board. 

This shows a clear boost in performance. As we can see, the investment in GridStore is paying off.
![image.png](/articles_data/gridstore-key-value-storage/1.png)

### End-to-End Benchmarking

Now, let’s test the impact on a real Qdrant instance. So far, we’ve only implemented GridStore for [**payloads**](/documentation/concepts/payload/) and [**sparse vector**](/documentation/concepts/vectors/#sparse-vectors), but even this partial switch should show noticeable improvements.

For benchmarking, we used our in-house [**bfb tool**](https://github.com/qdrant/bfb) to generate a workload. Our configuration:

```json
bfb -n 2000000 --max-id 1000000 \
    --sparse-vectors 0.02 \
    --set-payload \
    --on-disk-payload \
    --dim 1 \
    --sparse-dim 5000 \
    --bool-payloads \
    --keywords 100 \
    --float-payloads true \
    --int-payloads 100000 \
    --text-payloads \
    --text-payload-length 512 \
    --skip-field-indices \
    --jsonl-updates ./rps.jsonl
```
This benchmark upserts 1 million points twice. Each point has: 
- A medium to large payload
- A tiny dense vector (dense vectors use a different storage type)
- A sparse vector

---------------------------
#### Additional configuration:

1. The test we conducted updated payload data separately in another request. 

2. There were no payload indices, which ensured we measured pure ingestion speed.

3. Finally, we gathered log latency metrics for analysis.

---------------------------

We ran this against Qdrant 1.12.6, toggling between the old and new storage backends. 

### Final Result 

Data ingestion is twice and fast with a smoother throughput — a massive win! 

![image.png](/articles_data/gridstore-key-value-storage/2.png)

We optimized for speed, and it paid off—but what about storage size?
- GridStore: 2333MB
- RocksDB: 2319MB

Technically, RocksDB is slightly smaller, but the difference is negligible compared to the 2x faster ingestion and more stable throughput. A small trade-off for a big performance gain! 🚀