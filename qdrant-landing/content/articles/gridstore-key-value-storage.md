---
title: "GridStore Unveiled: A New Frontier in Key-Value Storage"
short_description: ""
description: ""
preview_dir: /articles_data/gridstore-key-value-storage/preview
social_preview_image: /articles_data/gridstore-key-value-storage/social-preview.png
weight: -150
author: Luis Cossio & Arnaud Gourlay, edited by David Myriel
date: 2025-02-01T00:00:00.000Z
category: vector-search-manuals
---

## Key-Value Storage in Qdrant

Every database or search engine needs a reliable place to store and retrieve data. This is where key-value storage comes in. It links unique keys to their corresponding values.

There are many key-value storage solutions available. Most are designed to be embedded in an application as a persistence layer. They handle basic operations like inserts, updates, and deletions.

In 2020, we chose RocksDB for Qdrant. It was mature, high-performance, and came with extensive documentation. It was ready to use out of the box. Over time, however, we realized we could build something even better.

When Qdrant started, we used **RocksDB** as the storage backend for payloads and sparse vectors. RocksDB, known for its versatility and ability to handle random reads and writes, seemed like a solid choice. But as our needs evolved, its “*general-purpose*” design began to show cracks.

> RocksDB is built to handle arbitrary keys and values of any size, but this flexibility comes at a cost. 

A key example is compaction, a process that reorganizes data on disk to maintain performance. **Under heavy write loads, compaction can become a bottleneck**, causing significant slowdowns. For Qdrant, this meant huge latency spikes at random moments causing timeout errors during large uploads—a frustrating roadblock.

To solve this, we built a **custom storage backend** optimized for our specific use case. Unlike RocksDB, our system delivers consistent performance by ensuring reads and writes require a constant number of disk operations, regardless of data size. As a result, you will get faster and reliable performance - free from latency-spikes.


## Challenges in Customization

RocksDB showed us several areas where it did not quite meet our specific needs. It is designed to handle generic keys and values. It uses an LSM architecture. This architecture requires compaction. Compaction can lead to latency spikes during write-heavy operations. We also struggled with the lack of detailed knowledge about its internals. Even though there is plenty of documentation, it was hard to optimize its configuration for our use case. Finally, integrating a C++ project into our workflow created significant friction for our developers.

As Qdrant evolved, we decided that we needed a storage solution that fit our requirements more tightly. You might wonder why we would invest time and resources into building something custom when there are plenty of options available. The answer lies in our specific needs.

We do not need generic keys. Our internal IDs are sequential integers with no gaps. We want full control over our operations, including when data is flushed to disk. Qdrant already has its own write-ahead log (WAL) and recovery procedures to handle crashes. This means we do not need an extra WAL at the storage level. Online compaction is not essential for us either. Our segment optimizer handles merging segments as needed. We have also experienced several lengthy investigations into data losses caused by misconfigurations of RocksDB. Ultimately, we needed something simpler—something that we could control entirely.

With this in mind, we began rethinking how to handle sequential keys linked to variable-sized data.

## Building a Custom Key-Value Store
![image.png](/articles_data/gridstore-key-value-storage/gridstore-2.png)
We want very fast reads. Given a key, the system should quickly locate its associated value, regardless of its size. To achieve this, keys are stored in an array that holds key information. Each entry indicates where the data starts and how long it is. We call this information a pointer. Because our keys are sequential, retrieving the pointer for key 3 is as simple as accessing the array at offset 3.

Variable-sized data is a bit more complex than a simple array. We divide the data section into fixed-size blocks. When inserting a value, its content is stored in one or more consecutive blocks. This method ensures that each block contains data from only one value. The blocks are then packed into page files of a fixed size.

Together, these two mechanisms allow for efficient data insertion and lookup. Data is always appended after the last used block, and a lookup requires only two reads: one for the pointer and one for the data itself.

**The Data Layer** consists of fixed-size blocks that store the actual data. The block size is a configurable parameter that can be adjusted based on the workload. Each record occupies the required number of blocks. If the data size exceeds the block size, it is split into multiple blocks. If the data size is smaller than the block size, it still occupies an entire block.

{{< figure src="/articles_data/gridstore-key-value-storage/architecture-1.png" alt="A Key-Value Store is the First Element of the System" caption="A Key-Value Store is the First Element of the System" >}}

### Reusing Storage Space

The real challenge is handling updates—whether it’s removals or rewrites. We don’t want to perform compaction, yet we also don’t want the storage to grow indefinitely. We need our storage to reuse space.

If we only had pointers and no metadata about the data itself, how could we tell whether a block is available? This is where a bitmask comes into play. Each bit in the bitmask represents a block. A bit set to 1 means the block is in use; a bit set to 0 means it is available.

Now we have a structure that can quickly tell us which blocks are free. When we remove a value, we mark its pointer and blocks as deleted. To update a value, we write the new data elsewhere, mark the previous blocks as deleted, and update the pointer accordingly.

**The Mask Layer** contains a bitmask that indicates which blocks are occupied and which are free. The size of the mask corresponds to the number of blocks in the Data Layer. For instance, if we have 64 blocks of 128 bytes each, the bitmask will allocate 1 bit for every block in the Data Layer resulting in 8 bytes. This results in an overhead of 1/1024 of the Data Layer size, because each byte in the mask covers 1024 bytes of blocked storage. The bitmask is stored on disk and does not need to be loaded into memory.

{{< figure src="/articles_data/gridstore-key-value-storage/architecture-2.png" alt="Introducing the Bitmask" caption="Introducing the Bitmask" >}}

### Managing User Payloads

Let’s break this down step by step. The bitmask gives us a magnification over the data. For example, if each block is 128 bytes, the bitmask offers a thousandfold view (128 * 8 = 1024). But this might not be sufficient for large-scale systems.

Consider this: a segment can easily hold 10 million points. If each payload is under 128 bytes, the minimal data size is around 1.2 GB. That means the bitmask would occupy about 1.2 MB. If we perform many updates, scanning through a megabyte of bitmask repeatedly could become resource-intensive.

We need a higher-level mechanism to provide an overview of the bitmask itself. To solve this, we track fixed-size regions of the bitmask. We summarize each region by identifying its largest section of consecutive free blocks. We call this a region gap.

We also store the leading and trailing gaps of each region. This allows us to combine adjacent regions if we need a large number of blocks for a single value.

With this gap structure in place, we achieve a magnification of about one millionth over the stored data. This amounts to roughly 6 KB per GB of data. It easily fits in RAM and is quick to scan.

**The Region** is an additional structure which tracks gaps in regions of the bitmask. This is to get an even smaller overhead against the data, which can be loaded into memory easily. Each region summarizes 1KB of bits in the bitmask, which represents a millionth scale of the Data Layer size, or 6 KB of RAM per GB of data.

**The Tracker Layer** is in charge of fast lookups, it directly links the IDs of the points to the place where the data is located.

{{< figure src="/articles_data/gridstore-key-value-storage/architecture-3.png" alt="The Region Gap" caption="The Region Gap" >}}

### Final Architecture

Putting all these concepts together, we’ve restricted how much computation is needed for a single update: 

1. Using the gaps structure, find which region has enough available blocks.
2. Within the region in the bitmask, find where those blocks are.
3. Write the value in the blocks.

Finding the blocks within the bitmask region is also super fast, because we’re always scanning just about 1KB of the bitmask in a CPU-optimized way.

### Maintaining Data Integrity

Our system has four components that must stay in sync: the Data Layer (stored values), the Mask Layer (bitmask tracking block usage), the Region (gap structure for free blocks), and the Tracker Layer (mapping keys to data locations).

Every time we insert or update a value, we must update all these components. In production, however, crashes and failures are inevitable—whether from logical errors, out-of-memory issues, disk write failures, or power losses. What if a crash occurs mid-update? What if some components are flushed to disk while others are not? Can we safely replay an operation from our write-ahead log (WAL)?

An acknowledgment from Qdrant means the operation is in the WAL and can be replayed if needed. This demands idempotency: repeating an operation should leave the system in the same state as if it were executed just once.

To achieve this, our storage writes the data first and defers updating the rest of the system until later. This lazy approach prevents premature deletion and, in the worst case, may result in writing data twice—but it guarantees data integrity.

### Model Testing
![image.png](/articles_data/gridstore-key-value-storage/gridstore-1.png)

One effective way to test our key-value storage is through model testing. We expect our storage to behave like a persistent hash map from the user’s perspective. To validate this, we:
	1.	Initialize a GridStore and an in-memory hash map.
	2.	Generate a large sequence of random operations (put, delete, update).
	3.	Apply each operation to both GridStore and the hash map, ensuring the results match.
	4.	Perform an in-depth comparison of all keys between the two systems.

This approach greatly increases our test coverage and helps ensure reliability.

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

This approach has a high return on investment to find bugs and we recommend giving a try to model testing if your system can be modeled according to a well defined existing component.

We also could have compared against RocksDB but we wanted a really fast execution with large sequences.

To go even further, model testing can be improved by mixing it with Property Based Testing in order to get nice minified bugs by leveraging various shrinking mechanisms. 

### Crash testing

Having a design that guarantees data integrity during crashes is important—but testing it is even more crucial.

We took a pragmatic approach by asking: What happens if Qdrant crashes repeatedly during a heavy update workload over an extended period?

To answer this, we built our own crash test bench called Crasher. Crasher is a standalone program that supervises a Qdrant binary and intentionally disturbs it. It runs a write-heavy workload while randomly killing and restarting Qdrant.

Each time Qdrant restarts, it replays its WAL. This lets us check data integrity from both Crasher’s perspective and on the server side.

Possible anomalies include:
	•	A point is completely missing.
	•	A point is missing a vector.
	•	A point is missing a payload.
	•	A point has an incorrect payload value.

This approach might seem naive, but it has proven very effective at uncovering issues when run over long periods.

We also use a more traditional chaos testing setup to examine Qdrant’s distributed aspects. However, Crasher fills a unique niche with its fast feedback cycle and aggressive local testing.

## Analyzing Results: Improvement or Flop?
![image.png](/articles_data/gridstore-key-value-storage/gridstore-3.png)

### Component benchmarking

Leveraging `bustle`, a kv-storage benchmarking framework, we made a component benchmark which directly compares the new storage and RocksDB (in the same configuration as we use it in Qdrant) against 3 different workloads:

- **read heavy**: 95% of operations are reads
- **insert heavy**: 80% of operations are inserts
- **update heavy**: 50% of operations are updates

![image.png](/articles_data/gridstore-key-value-storage/1.png)

The chart shows that latency has dropped significantly for writes.

So far it looks like a good return on investment.

### Benchmarking End-to-end 

Finally, let’s see it in action with a real Qdrant instance. We have currently replaced only the storage for payloads and sparse vectors. The benchmark workload was created using our custom bfb tool. If you’re interested, here is the command we used.

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
It’s a long list of options, but essentially the benchmark does the following:
	•	Upserts 1M points twice.
	•	Each point contains:
	•	A medium to large payload,
	•	A very small dense vector (dense vectors use a different storage type),
	•	A sparse vector.
	•	A separate request sets the payload again.
	•	No payload indices are created, ensuring we measure pure ingestion performance.
	•	Latencies are saved to a file.

We ran this benchmark on Qdrant version 1.12.6, using special flags to switch between the two storage backends. The results speak for themselves: total ingestion time is 2x faster, and throughput is more stable 😍.

![image.png](/articles_data/gridstore-key-value-storage/2.png)

We optimized for speed and it paid off, but what about storage size?

Total storage size: 2333MB for gridstore, vs 2319MB for rocksdb

Strictly speaking, rocksdb has an edge here. But considering the other improvements, it becomes negligible.

## Conclusion
![image.png](/articles_data/gridstore-key-value-storage/gridstore-4.png)
- general-purpose systems make trade-offs
- specificity pays off
-







