---
draft: false
title: "Universal I/O: single interface for mmap, io_uring and S3"
short_description: "How Qdrant talks to different storage backends through a unified I/O interface"
description: "A deep dive into Qdrant's Universal I/O, which allows consumer code to interact with different storage backends (mmap, io_uring, network-backed) through a unified interface"
social_preview_image: /articles_data/universal-io/preview/social_preview.jpg
preview_dir: /articles_data/universal-io/preview
weight: 1
author: Luis Cossío, Clelia Bertelli
date: 2026-10-12T00:00:00Z
keywords:
  - rust
  - io
  - mmap
  - io_uring
  - s3
category: qdrant-internals
---

Qdrant reads all its on-disk data through `mmap`: vectors, HNSW graphs and payload indexes. `mmap` assumes a real disk sits underneath.

In [serverless mode](https://qdrant.tech/serverless/) the source of truth is object storage, which Qdrant caches on local disk. A read that misses that cache crosses the network, and it gets much slower.

On our test box a cold `mmap` read of an EBS gp3 volume took 568 µs. From a same-region S3 bucket it took 24.3 ms, 43 times slower. From another region, 131 ms. Faster local storage only widens the gap, and a network read can fail in ways a disk read cannot.

One option was to re-implement every one of those interactions against object storage, but that would have meant maintaining two versions of the same logic, which tend to drift apart over time. Every data structure would also have needed to switch between the two versions, which could change the behavior of the local path that already worked well. 

We therefore decided to build a single interface that lets us hot-swap the storage backend underneath the same code, and that work became **Universal I/O**. In this blog we focus on the read path, since that is where most of our optimizations ended up.

<aside role="status">
    The code snippets in this blog are pseudo-Rust. They simplify the real code (for example, by dropping generics, trait bounds, lifetimes, and error handling) to show the idea, but they are not working code and are not meant to compile.
</aside>

## Different Backends, Very Different Costs

`mmap` is a solid choice for local files because you read the file as a borrowed slice of bytes (`&[u8]`), the OS keeps hot pages cached in memory, and it loads only the pages you touch. The problem was never performance, but the fact that the implementation was tied to one concrete type, so we could not reuse the same components with any other backend.

What we needed instead was a single abstract interface (a `trait`, in Rust terms, similar to interfaces in Go and protocols in Python) that standardizes the contract for every backend, rather than a separate concrete implementation for each component. That interface had to cover at least three backends, and they behave very differently from each other:

- **`mmap`**: synchronous. Very cheap when the data is already in RAM, but a read of cold data blocks on a page fault (568 µs on the EBS gp3 volume we measured on).
- **`io_uring`**: queued. Many reads can run concurrently, but works only on Linux kernel v5.1 or later (it was introduced in 2019).
- **Network I/O**: asynchronous. Very expensive when the data isn't cached locally (24.3 ms per round trip to a bucket in the same region, and 131 ms to one in another region), and exposed to failure modes that disk reads don't have.

## Neither Async nor Blocking Fits

Because of this gap in cost, the design of the interface seemed to be limited to two approaches, and each with a clear downside:

- **Make everything async.** This is a great fit for network storage, but a poor fit for `mmap` and for data that is already cached, because async isn't free in Rust. It needs a runtime, and the compiler optimizes async code poorly. On our test box a warm 8-byte read took 18 ns. The same read inside a Tokio runtime took 106 ns. The extra 88 ns matters on cached data and not on a 568 µs cold read.
- **Make everything blocking.** This suits the existing `mmap` code, but it is terrible for network requests. A same-region request took 43 times longer than a cold disk read. When each request blocks until it finishes, that wait piles up quickly.

After a few iterations, we settled on a middle ground, a `ReadPipeline` abstraction modeled on `io_uring`, in which you schedule reads (like pushing to a submission queue) and then wait for results (like reading from a completion queue), while each backend implements the pipeline in the way that suits it best.

{{< island
    path="content/articles/headless/universal-io/architecture"
    width="760" ratio="760 / 286"
    title="One `ReadPipeline` keeps consumer code unchanged while each backend chooses its own execution model and concurrency."
>}}
![Consumer code calls the same Universal I/O traits for three different read paths: mmap returns a borrowed slice directly at depth 1; io_uring submits local disk reads to the Linux kernel through a submission ring and receives them through a completion ring at depth 16; network I/O runs up to 256 remote object-storage requests as Tokio tasks.](/articles_data/universal-io/uio-architecture.svg)
{{< /island >}}

## Filesystems, Files, and Pipelines

Universal I/O is built on a set of interdependent Rust traits, and three of them matter for the rest of this blog:

- `UniversalReadFs` is a filesystem handle, which checks whether files exist, lists them, and opens them.
- `UniversalRead` is a file handle that does the actual reading. The caller picks the element type `T`, such as `f32` or `u32`, and passes a hint about the access pattern (sequential or random), and when a backend returns a buffer it allocated itself, it aligns that buffer for `T`, so the bytes can be cast to a slice of `T` without copying.
- `ReadPipeline` ties the other two together: you schedule reads, wait for any of them to finish, and repeat.

Stripped down to the parts this blog uses, the three traits look like this:

```rust
trait UniversalReadFs {
    fn open(&self, path, options) -> File;
}
trait UniversalRead {
    fn read<T>(&self, range, access_pattern) -> Cow<[T]>;
}
trait ReadPipeline<UserData> {
    fn can_schedule(&mut self) -> bool;
    fn schedule(&mut self, user_data, file, range);
    fn wait(&mut self) -> Option<(UserData, Cow<[u8]>)>;
}
```

Reads return a `Cow` (clone-on-write), a standard library type that holds either borrowed or owned data, so that `mmap` can stay zero-copy by returning a slice borrowed from the mapped file, while `io_uring` and the network backend return owned buffers, and the consumer handles both in the same way.

Each backend also chooses its pipeline depth, meaning how many reads can be in flight at once: 

- `mmap` uses 1, because it reads as soon as a read is scheduled and therefore behaves synchronously, like the direct `mmap` access it replaces 
- `io_uring` uses 16 
- the network backend allows up to 256

A full pipeline accepts no more reads until `wait()` returns a result. 

Since reads can finish out of order when the depth is above 1, each request also carries a tag, the *user data*, which comes back with its result and tells the caller which request it answers. It works like `user_data` in `io_uring`, except that it can be any type, and in practice it is often a vector's position in the batch or a point ID.

The loop at the heart of the default `read_batch` method shows how these pieces fit together, since it keeps the pipeline as full as the backend allows, takes whichever read finishes first, and hands it to a callback along with its user data:

```rust
loop {
    // Fill the pipeline as much as the backend allows
    while pipeline.can_schedule() {
        let Some((user_data, range)) = ranges.next() else { break };
        pipeline.schedule(user_data, file, range);
    }
    // Take whichever read finishes first and hand it to the caller
    let Some((user_data, data)) = pipeline.wait() else { break };
    callback(user_data, data);
}
```

On `mmap`, this loop schedules one read, waits for it, and repeats, while on the network backend the same loop keeps up to 256 requests in flight, and the consumer code is identical in both cases.

The two local backends implement this same pipeline: the `mmap` backend queues nothing, since scheduling a read slices the mapped file and `wait()` hands the slice back, and its `MmapFile` type is also what the disk cache uses as the local mirror of a remote file.

The `io_uring` backend has a queue depth of 16, and it keeps each request's user data in a slab (a vector of reusable slots) whose key travels with the request as `io_uring`'s own `user_data`, so that a completion points back to the caller's tag. 

When the page cache is warm, reads complete almost immediately, so the pipeline holds newly scheduled reads and submits them in a single syscall once it runs out of completed results, instead of making one syscall per read. A file can also be opened with `O_DIRECT` to bypass the page cache entirely, at the price of aligning every read to 4 KiB.

## A Bridge to Async-Land

None of the code described so far uses async Rust, but network reads need it, since a single round trip takes tens of milliseconds and running requests one after another would be far too slow. They have to run concurrently without too much threading overhead, which raises the question of how to keep the pipeline synchronous while the requests complete asynchronously, and we solve it with a bridge in which the pipeline schedules and waits exactly as before, while the async work runs on a dedicated Tokio runtime.

Here is a simplified view of how a read flows through the bridge:

1. `schedule` stores the caller's user data in a slab slot, the same trick the `io_uring` backend uses, and spawns the read onto a Tokio worker, which gets its own clone of the reply channel sender to send back the result:
    
    ```rust
    fn schedule(&mut self, user_data, file, range) {
        if self.in_flight == 256 { return Err(QueueIsFull) }
        let slot = self.slots.insert(user_data);   // remember the caller's tag
        let reply_tx = self.tx.clone();
        spawn_on_tokio(async move {
            // a panic is caught and becomes an error
            let result = catch_panic(read_from_object_store(file, range)).await;
            reply_tx.send(Response { slot, result }).await;
        });
    }
    ```
    
    Because the read runs on another thread, `schedule` returns immediately, and a panic in the task becomes an error reply, so that `wait` never blocks forever.
    
2. `wait` calls `blocking_recv` on the pipeline's receiver, which lets synchronous code receive a response from the async worker, and since each response carries its slot, `wait` can reunite the result with the caller's user data, in the order the requests finish:
    
    ```rust
    fn wait(&mut self) {
        if self.slots.is_empty() { return None }
        // Block until a worker replies.
        let response = self.rx.blocking_recv();
        // Reunite the result with its tag.
        let user_data = self.slots.remove(response.slot);
        Some((user_data, response.result))
    }
    ```
    

The following diagram shows the whole flow:

{{< island
    path="content/articles/headless/universal-io/async-bridge"
    width="760" ratio="760 / 258"
    title="The synchronous pipeline schedules A, B, and C; Tokio finishes them B, C, then A, and slots match each result to its request."
>}}
![A synchronous caller thread schedules reads A, B, and C, each spawned onto a Tokio worker. It then calls wait() three times, blocking each time until a reply arrives. Replies return in finish order: B, then C, then A.](/articles_data/universal-io/uio-async-bridge.svg)
{{< /island >}}

## Mirroring Remote Object Storage to Local Disk

Even with the async bridge, a network read is still far slower than a read from memory or local disk, but with a generic I/O interface already in place, we can build a tiered solution on top of it: a backend that caches data by mirroring remote files into local `mmap` files, which we call `DiskCache`.

When `DiskCache` opens a remote file, it creates an empty local file of the same size, logically split into 16 KiB blocks, and it keeps a `RoaringBitmap` (a compressed bitmap) that records which blocks are already local.

This design relies on one guarantee, which is that in serverless mode the files Qdrant stores in object storage are **immutable or append-only**, so a remote file can grow but its existing bytes never change. As a result, a fetched block never goes stale, which means that we don't have to track dirty pages or invalidate anything, and if two reads fetch the same block at once, they write identical bytes to the mirror, so it doesn't matter which one lands last.

A read through `DiskCache` then goes like this:

1. **Check the bitmap.** If all the blocks the read needs are local, it is a cache hit and we return a slice of the local mmap, but if even one block is missing, we fetch the whole covering block range from the remote.
2. **On a miss, try to piggyback, or fetch.** Sending a request for every miss would waste round trips, so we first check whether another read in the same batch is already fetching blocks that cover ours. For example, if we need blocks 7 to 10 and another read is already fetching blocks 6 to 12, we wait for that request instead of sending our own, and a new request goes out only when no in-flight one covers our whole range.
3. **Write to the mirror, then read from it.** When a remote read returns, we write the bytes into the local mmap, mark the blocks in the bitmap, and return a slice borrowed from the `MmapFile` instead of the remote buffer, so that hits and misses return the same kind of result.

{{< island
    path="content/articles/headless/universal-io/disk-cache"
    width="760" ratio="760 / 270"
    title="Every `DiskCache` path returns a local mmap slice; misses populate the mirror first, and covered reads reuse an in-flight fetch."
>}}
![Three DiskCache paths converge on a local mmap slice: a hit reads local blocks directly, a miss fetches and writes missing blocks first, and a covered read waits for an existing in-flight fetch.](/articles_data/universal-io/uio-disk-cache.svg)
{{< /island >}}

Put together, the whole flow looks like this, where the real pipeline splits scheduling and waiting into separate calls but follows the same logic:

```rust
fn read(range) -> Slice {
    let blocks = blocks_covering(range);

    // 1. Hit: every block is already local (the flag skips the bitmap once all are)
    if self.fully_populated || self.fetched.contains_all(blocks) {
        return self.mirror.slice(range);
    }

    // 2. Miss: piggyback on an in-flight fetch that covers our blocks, or start one
    let fetch = match self.in_flight.find(|f| f.blocks.contains(blocks)) {
        Some(fetch) => fetch,
        None => self.in_flight.start(remote.read(blocks)),
    };

    // 3. Write the fetched bytes to the mirror, mark them, and read from the mirror
    let bytes = fetch.wait();
    self.mirror.write(blocks, bytes);
    self.fetched.insert(blocks);
    self.mirror.slice(range)
}
```

Once every block is local, the `fully_populated` flag lets reads skip the bitmap and its lock entirely. At that point a read is just a slice of the local `MmapFile`, the same kind of operation the `mmap` backend performs. The first read of a block still costs a 24.3 ms round trip. Every read after it costs 568 µs, the price of a local `mmap`.

Append-only files can also grow, and reopening one would mean fetching everything again, so `DiskCache` grows the mirror in two phases: it first *stages* the change by learning the new remote size and prefetching the new tail, without any visible effect for readers, and then *applies* it by growing and remapping the local file. This lets Qdrant stage reloads for many files at once and pay only for the slowest one.

## What the Depth Buys

{{< chart id="universal-io/frontier" caption="Each dot is one configuration on a 4-core Xeon 8375C in us-west-2, page cache dropped before each run. Up and left is better: more MB/s for less wait. The dashed staircase is the frontier, the settings nothing else beats on both measures." caption2="The same two measures for reads in order. Local storage jumps to the top left, because the kernel reads ahead. Object storage does not move." >}}

{{< chart id="universal-io/endpoints" caption="One read at a time against the most each backend allows, on random reads." caption2="The same two settings by what the caller waits. mmap pays 71 ms for bandwidth it already had one read at a time." >}}

`io_uring` turns depth into bandwidth. Each doubling of the batch doubles it, from 7.15 MB/s at batch 1 to 85.66 MB/s at batch 16. The wait rises 9% over that range. Past 16 the ring is full and the extra reads only queue. Batch 512 buys 29% more bandwidth, and the wait rises to 9.4 ms for it.

`mmap` turns depth into waiting. Its pipeline is one deep, so a bigger batch buys a queue rather than concurrency. Bandwidth sits at 7.2 MB/s whatever the batch. The wait grows instead, from 0.55 ms per read at batch 1 to 71 ms at batch 256.

S3 turns readers into bandwidth, but never into a shorter wait. One read takes about 24 ms however many readers run. Bandwidth climbs from 0.17 MB/s with one reader to 11.3 MB/s with 128. Qdrant's own blob pipeline, which is 256 deep, reached 34.7 MB/s.

Read in order and depth stops mattering. Opened with `MADV_SEQUENTIAL`, `mmap` reached 117 MB/s against 7.2 MB/s in random order. The batch changed nothing, from 115 MB/s at batch 1 to 119 MB/s at batch 256. The kernel reads ahead, so most reads never reach the disk.

The backend still matters, though. `io_uring` managed 215 MB/s on the same reads, because bulk reads keep the device busier than page faults do. Object storage gains nothing from order, as expected, because nothing reads ahead across network requests. A read costs about 23 ms either way. Up to 64 readers, the random and sequential numbers stay within 11% of each other.

Depth also only helps when there is more than one read to issue. One point by ID, one posting-list entry or a file header is still a single round trip of roughly 24 ms on object storage, however deep the pipeline is.

## The Best of All Worlds (Almost)

Universal I/O started with a narrow question, which was how to read the data structures we already have from storage that isn't a local disk, and the answer turned out to be less about any single backend and more about finding the right interface between them.

With that interface in place, the storage backend really is hot-swappable: the same search code reads vectors from a local `mmap` file on a laptop and from S3 in serverless mode. The local path keeps using `mmap`, and the interface costs it nothing we can measure. A warm read through `UniversalRead::read` took 18.00 ns, against 18.43 ns for the same read as a plain function call. The price on our side was having to create a complex set of interdependent traits to generalize the I/O interface, but we think it is a trade worth making, since every new backend can now plug into Qdrant without touching the data structures that use it.

If you want to see how it fits together, start with the [`universal_io` module](https://github.com/qdrant/qdrant/tree/master/lib/common/common/src/universal_io) in the Qdrant repository and, if you have any questions about it, join our [Discord Community](https://discord.gg/qdrant) and we'll try to answer there!
