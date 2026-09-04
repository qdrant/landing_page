---
title: "Internals of Dense Vector Storage"
short_description: "How a single named vector gets stored, grown, and read back in RAM, on disk, and through the kernel, once a collection's dimension and distance metric are fixed."
description: "Why Qdrant's dense vector storage needs no index, and how the volatile, immutable mmap, and appendable mmap storages differ under the hood."
preview_dir: /articles_data/internals-of-dense-vector-storage/preview
social_preview_image: /articles_data/internals-of-dense-vector-storage/preview/social_preview.jpg
author: Clelia Bertelli
author_link: https://qdrant.tech/
draft: false
date: 2026-08-27T00:00:00+03:00
keywords:
  - vector storage
  - memory-mapped files
  - mmap
  - Qdrant internals
  - segment storage
category: qdrant-internals
weight: 1
---

This is the first article in a series on Qdrant's storage internals, and it
covers one question: once a collection has a fixed vector dimension and
distance metric, how does a single named vector get stored, grown, and
read back, in RAM, on disk, and through the kernel? 

<!-- TODO: links-->
This article only focuses on **dense, non-quantized vectors**. Sparse vectors and quantization build on top of what's described here and have their own articles ([here]() and [here]()).

<!-- TODO: link-->
Blob storage, the layer under payloads and variable-sized vectors, will be the
subject of the [next article](). 

<aside role="status">
Code references below point into <a href="https://github.com/qdrant/qdrant/tree/master/lib/segment/src/vector_storage"><code>lib/segment/src/vector_storage/</code></a>
in the Qdrant repository, unless stated otherwise.
</aside>

## The Shape of The Problem

A segment is where points live: vectors, payload, and the indexes over
both. Inside a segment, each named vector field owns its own storage
object, which has to answer two questions:

- Where does vector N live, given its offset?
- What happens between writing a vector and being able to query it?

For dense vectors, the first question has a clean answer: every vector in a given storage is the same byte size (`dim * size_of::<T>()`). Because of that, dense vector storage needs no allocator, free list or index: finding vector N is just multiplication. 

That same fact is also why Qdrant can run three different storage mechanisms behind one shared interface: an in-memory vector, a read-only memory-mapped file, and a growable memory-mapped structure. Other operations on the search path do not need to know which variant they are interfacing with, since the reading logic is shared.

![A three-column overview: VolatileDenseVectorStorage / DenseVectorStorageImpl / AppendableMmapDenseVectorStorage as three boxes under one shared 'VectorStorageRead / VectorStorage trait' banner, each annotated with its underlying medium (RAM Vec, single mmap file, directory of mmap chunk files) and whether it's read-only or read-write.](/articles_data/internals-of-dense-vector-storage/01-three-storages-overview.png)

## One Interface, Three Storages

Every dense vector storage implements the same trait hierarchy, defined in [`vector_storage_base.rs`](https://github.com/qdrant/qdrant/blob/master/lib/segment/src/vector_storage/vector_storage_base.rs):

- a read-only `VectorStorageRead` (`get_vector()`, `distance()`, ...)
- a `VectorStorage` on top of it that adds writes (`insert_vector()`,
`delete_vector()`, `flusher()`)
- a typed `DenseVectorStorage<T>` on top of that. 

Search and scoring code is cleverly written only against `VectorStorageRead`, so read-only segments can reuse all the scoring logic without depending on any write machinery at all.

All concrete storages are collected into one enum, `VectorStorageEnum`, accessed wherever a caller needs to reason generically over storage kind. 

This article covers three variants of that enum:

1. `DenseVolatile`, backed by `VolatileDenseVectorStorage`, RAM only.
2. `DenseMemmap` / `DenseUring`, backed by `DenseVectorStorageImpl`, a
  single memory-mapped file, read-only once built.
3. `DenseAppendableMemmap`, backed by `AppendableMmapDenseVectorStorage`, a
  directory of memory-mapped chunk files that can keep growing.

A given named vector is assigned a concrete storage variant only once, when the segment opens, based on the collection's configured storage type and memory placement. 

A running segment never switches a vector's storage kind in place. Instead, during optimization, `SegmentBuilder` builds an entirely new segment (the _proxy_) with a different storage kind and swaps it in atomically.

## No Disk at All

`VolatileDenseVectorStorage` is the baseline every other variant exists to improve on. Writes go straight into a `Vec`, reads are a slice index, `flusher()` returns a no-op, and there are no files to persist because there is nothing on disk. 

It exists for tests and small, throwaway configurations. Everything after this is more complicated for one reason: RAM alone doesn't survive a restart, and doesn't scale past the size of memory.

## The Kernel Mechanics Both Mmap Variants Share

Before looking at the two disk-backed storages, here are the three kernel-level concepts they both rely on.

![A layered diagram: userspace storage struct -> mmap'd virtual memory region -> kernel page cache -> disk file, with Advice/populate()/clear_cache() drawn as arrows acting at the mmap<->page-cache boundary, and a callout showing MADV_RANDOM / MADV_SEQUENTIAL / MADV_POPULATE_READ / MADV_PAGEOUT / MADV_DONTNEED as the actual madvise(2) hints behind each.](/articles_data/internals-of-dense-vector-storage/02-kernel-mechanics.png)

- **`Advice`** is a wrapper around `madvise(2)`, the syscall that tells the kernel how a mapped file will be accessed, and it comes in two flavors: 

  + `Random`, which disables the kernel's readahead, the process of loading nearby file data into memory before it's asked for
  + `Sequential`, which leans into readahead instead, and evicts older pages sooner. 

  Advice is set once per storage when it opens, based on the collection's config.

- **`populate()`** decides whether a storage loads its pages up front, instead of waiting for each one to be requested. Without it, the first time code touches an address that isn't in memory yet, the CPU has to pause and let the kernel fetch that page from disk (a mechanism known as _page fault_). 

  On newer Linux kernels, `populate()` asks the kernel to load the whole file in one call, while on older ones it walks the file manually to trigger the same effect.

- **`clear_cache()`** does the opposite: it tells the kernel that this
storage's pages can be dropped from memory if it needs the space. 

  This only affects pages that are already saved to disk: any pages still waiting to be written (_dirty pages_) are left alone, and are handled separately by the kernel's own background writer.

These three primitives are exactly what backs the collection-level `Memory` tiers:

- `Cold`: nothing is pre-loaded. The first query pays the page-fault cost, then things warm up.
- `Cached`: loaded up front with `populate()`, fast from the start, but can still be evicted under memory pressure.
- `Pinned`: loaded and, by convention, never evicted.


## Immutable Single-File Mmap

`DenseVectorStorageImpl` is what a finished, optimized segment uses to hold its vectors. It has a type parameter for its I/O backend: a plain memory-mapped file by default, or an [io_uring](/articles/io_uring/)-backed file on Linux. 

The storage logic itself is written once and works with either, and the same underlying abstraction also covers other backends, such as remote object storage or a connection to another Qdrant node, so dense vector storage gets those for free wherever they're plugged in.

### Why You Don't Need an Index

Vectors sit one after another in a file, `matrix.dat`, each taking exactly `dim * size_of::<T>()` bytes after a small header, so that finding vector `key` is plain arithmetic: `key * dim * size_of::<T>() + header_size`. 

The vector count itself isn't stored anywhere; instead, it's worked out from the file's
length when the storage opens, read through the storage backend rather
than the filesystem directly, since a remote backend like S3 has no local
file to check. 

A separate file, `deleted.dat`, holds one bit per point marking whether it's deleted.

![Byte-offset layout of matrix.dat: a header followed by fixed-stride vectors, with the key * dim * sizeof(T) + HEADER_SIZE formula pointing at vector N's byte range.](/articles_data/internals-of-dense-vector-storage/03-matrix-dat-layout.png)

### Two Ways of Reading

Reads take one of two paths, depending on whether the backend supports asynchronous I/O:

- With a **plain mmap file**, each read may block if the page it needs isn't in memory yet. This is the reason a first query against a cold, on-disk collection is slow.
- With **io_uring**, the storage collects all the byte ranges it needs for a batch, submits them to the kernel at once, and waits for the results. There's no per-vector stall, because the kernel fetches everything in the background while the batch is in flight.

![Side-by-side sequence diagram: synchronous mmap read stalls the CPU on each page fault, one vector at a time; io_uring read submits a batch of byte ranges up front and drains completions with no per-vector stall.](/articles_data/internals-of-dense-vector-storage/04-sync-vs-iouring-read.png)

### Append And Remap for New Vectors

The immutable storage, as the name implies, can't be grown one vector at a time: as evidence of it, calling the `insert_vector` methods panics. 

Data can only enter through `update_from`, called once by `SegmentBuilder` when it assembles a new, optimized segment out of older ones. 

Even then, existing bytes are never touched: the storage writes the new vectors past the end of the file, fsyncs them, and then rebuilds its memory map over the now-longer file.

Rebuilding, in this case, is required: an existing mmap has a fixed size, and growing the file underneath it doesn't extend the mapping; the only way to see the new bytes is to map the file again. 

This is also what _immutable_ means for this storage. The file can change, but once a byte is written it's never overwritten again. Growth only happens by appending in one batch, never through a live write path.

![Timeline diagram of update_from: [existing mmap, N vectors] -> open file in append mode -> write new vectors past EOF -> fsync -> old mmap dropped -> file reopened -> [new mmap, N+k vectors], with a note that the byte ranges belonging to the original N vectors are never touched.](/articles_data/internals-of-dense-vector-storage/05-update-from-timeline.png)

The one thing that does change after the fact is deletion: a fixed-size bitmap, sized to the vector count at open time, holds one bit per point and can be flipped without touching any vector bytes.

## Appendable Storage

`AppendableMmapDenseVectorStorage` is what a segment still accepting writes actually inserts new vectors into. In this variant, the `insert_vector` method works.

Instead of one file, it's a directory of preallocated, fixed-size `chunk_<n>.mmap` files, each holding a run of same-size vectors: a vector can never spans more than one chunk. 

A small `config.json` file records the dimension and chunk size, and a `status.dat` file, itself memory-mapped, tracks the current vector count so it can be updated in place.

![Directory tree of the appendable storage layout: config.json, status.dat, and chunk_0.mmap through chunk_N.mmap under vectors/, with a growing bitset under deleted/. An insert past the current chunk's capacity calls add_chunk() to map a new file instead of resizing an existing one.](/articles_data/internals-of-dense-vector-storage/06-appendable-storage-layout.png)

This design tackles the exact problem that forces us to remap in the immutable storage: a live mapping can't be resized while other code might still be reading from it. Splitting the storage across many small, preallocated files avoids that: growth means mapping a brand-new chunk file, not resizing one that's already in use.

Writing here consists of in-place mutation of already-mapped memory: the storage works out which chunk a vector belongs to and the offset inside it, grows the chunk list if needed, then writes directly into that chunk. 

There's no per-write fsync: the kernel's own dirty-page tracking handles that, and durability is only forced on an explicit flush.

Reads use the same offset math we saw above, but choose their `Advice` access pattern per call rather than once for the whole storage: even a storage opened with `Random` access will read one large vector with `Sequential`-style access, since a big read benefits from readahead regardless of the storage's general pattern. 

Deletion uses a bitset that's allowed to be smaller than the vector count. A point can be deleted before the bitset has grown to cover its position, so any offset past the end of the bitset is simply treated as "not deleted."

## Durability From the Bottom Up

None of these storages know how to "flush bytes" in any general sense.

Each one's `flusher()` is built by composing the flushers of whatever it's made of: the volatile storage's does nothing, the immutable storage's only flushes the deletion bitmap since vector data is already fsynced during `update_from`, and the appendable storage's flushes each chunk, then the status file, then the deletion flags, in sequence. 

A segment's own flush walks down through segment, then vector storage, then chunk files, following this same pattern at every level instead of reaching past its neighbors to touch raw files directly.

## Putting It Together

![A single combined read/write lifecycle diagram across all three storages: three parallel lanes (Volatile / Immutable mmap / Appendable mmap), each showing a WRITE path down to a MEDIUM box (RAM Vec / single mmap file via bulk append+remap / chunk files via direct in-place write) and a READ path (Vec index / sync page-fault or async io_uring / sync page-fault or async io_uring), converging at the bottom into a shared 'VectorStorageRead -> RawScorer -> QueryScorer' box to emphasize that scoring code never knows which lane it's in.](/articles_data/internals-of-dense-vector-storage/07-combined-lifecycle.png)

The key takeaway of this article is that because every dense vector is exactly the same size, finding vector N is never more than a multiplication. 

That's what makes it cheap for Qdrant to run three different storage mechanisms behind one shared interface, and to pick sync or async reads per backend, without any of that variation reaching the code that scores a query against stored vectors.

<!-- TODO: link-->
If you're curious about how Qdrant handles storage for variable-size elements, such as payloads or multivectors, take a look at the [next article]().
