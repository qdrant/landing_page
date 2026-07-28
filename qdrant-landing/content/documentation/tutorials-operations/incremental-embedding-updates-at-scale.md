---
title: Incremental Embedding Updates at Scale
short_description: "Sync embeddings with changing raw data when a full scan per run is too expensive."
description: "Keep a large Qdrant collection in sync with documentation that changes over time by comparing bucket digests, so each run reads only the parts of the corpus that changed."
weight: 33
---

# Incremental Embedding Updates at Scale

| Time: 35 min | Level: Advanced | Output: [GitHub](https://github.com/qdrant/examples/blob/master/temporal-data-drift/sync_at_scale_with_digests.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/temporal-data-drift/sync_at_scale_with_digests.ipynb) |
| --- | ----------- | ----------- | ----------- |

[Incremental Embedding Updates](/documentation/tutorials-operations/incremental-embedding-updates/) keeps a Qdrant collection in sync with changing documentation by reconciling the full list of current chunks against the whole collection on every run. It's a simple setup with few moving parts, and it works well for many mid-sized corpora.

It doesn't scale, though. Every run reads every point, so the cost of a sync tracks the size of the corpus rather than the size of the change. At around 100,000 points that's still cheap. By around a million points, a run moves hundreds of megabytes to update a handful of chunks, and individual requests start hitting Qdrant's 32 MB cap ([`max_request_size_mb`](/documentation/ops-configuration/configuration/)). Batching doesn't fix this. It splits the same full scan into more round trips.

This tutorial covers the alternative: add a small summary layer on top of the first design, so each run scans the summary and touches only the parts of the collection that changed. It's more machinery to maintain, and it's worth it once your corpus is large and your daily change set is small next to it.

The tutorial has an accompanying [notebook](https://github.com/qdrant/examples/blob/master/temporal-data-drift/sync_at_scale_with_digests.ipynb).

## The Idea

Split the chunks into a fixed number of **buckets** and give each bucket a **digest**: a single number that summarizes the whole bucket's state.

A bucket's digest is built from the digests of the chunks inside it. A chunk's digest depends on where the chunk lives in the docs (which page, which section, which piece of that section) and on its current text. So if a chunk's text changes, or a chunk enters or leaves the bucket, the bucket's digest changes and you know that bucket needs inspection. If the digest is unchanged, the bucket's contents are unchanged and you skip it.

The setup uses two collections:

- The **chunks collection**, whose embeddings serve vector search. This is the collection from the first tutorial plus one extra payload field, `sync_bucket`. Point IDs are unchanged: still a stable ID derived from the chunk's address. Per-chunk digests aren't stored, since they're cheap to recompute and only the per-bucket digest matters.
- A small **summary collection** holding each bucket and its digest. This is the sync state.

Two decisions carry the method.

**Compare, don't scan.** Compute the digests from the current source, then compare them against the digests Qdrant already holds. Only the buckets whose digest differs get reconciled. The rest of the chunks collection is never read.

**Combine chunk digests with XOR.** XOR is order-independent, so whatever order the chunks come back in, the same set produces the same bucket digest. It folds any number of chunk digests into one fixed-width number with one cheap operation, so the summary stays small no matter how big the bucket. And it's reversible, since XORing a value twice cancels it, which means a bucket digest can be patched for a single added or removed chunk instead of rebuilt. This tutorial recomputes each changed bucket from scratch for clarity, but that reversibility is why XOR is the natural choice.

### The Math Behind the Idea

Say you use 2^16 = 65,536 buckets. For a corpus of 1,000,000 chunks that's about 15 chunks per bucket. Each run compares 65,536 digests to find the changed buckets, then reads chunks only from those. If 50 chunks changed, they sit in at most 50 buckets, so you read on the order of 50 x 15 = 750 chunks instead of 1,000,000. The first tutorial reads all 1,000,000 every run.

You can go further and pack the 65,536 digests into a handful of points rather than storing one bucket per point. The summary collection section covers why and how.

For explainability, this tutorial uses **16 buckets**. All the code is written against one constant, `N_BUCKETS`. Set it to something reasonable for your corpus before you run this in production.

## Prerequisites

Install the [Qdrant client of your choice](/documentation/interfaces/#client-libraries).

This tutorial uses Qdrant Cloud and its [Free Embedding Inference](/documentation/cloud/inference/#free-embedding-models). Create a Free Tier [Qdrant Cloud cluster](https://cloud.qdrant.io/) and set `QDRANT_URL` and `QDRANT_API_KEY` in your environment.

Read the [first tutorial](/documentation/tutorials-operations/incremental-embedding-updates/) before this one. Chunking, normalization, the deterministic point ID, and the content fingerprint all carry over unchanged, and this tutorial assumes them.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="client-connection" >}}

## The Chunks

The chunking is the same as in the first tutorial. Each chunk has an address (which page by `url`, which section by `anchor`, which piece of that section by `chunk_num`) and its text. Two derived values do the work:

- `point_id`: a stable ID computed from the address. Same address, same ID.
- `content_hash`: a fingerprint of the text. Same text, same hash.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="chunks" >}}

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="identity-and-fingerprint" >}}

As in the first tutorial, run your text through a normalization pass before hashing it. Invisible characters and stray whitespace degrade the embedding, and they cost you a re-embedding when nothing meaningful changed.

## Buckets: Where Each Chunk Lives

A bucket is one of `N_BUCKETS` slots. A chunk's bucket comes from its `point_id`, so editing the text never moves a chunk to a different bucket:

```text
point_id = ID from (url, anchor, chunk_num)
bucket   = sha256(point_id) mod N_BUCKETS

example (the "Step 2: Enable TLS" chunk):
  point_id = "4e72de03-624c-5b8e-a3ef-93e3a2d3267b"
  bucket   = sha256(point_id) mod 16  =  11
```

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="buckets" >}}

Running that over the three sample chunks prints the bucket each one lands in:

```text
1  2ff5204a-0353-5991-ba55-acd1995063e8  .../secure-qdrant/#prerequisites
11 4e72de03-624c-5b8e-a3ef-93e3a2d3267b  .../secure-qdrant/#step-2-enable-tls
12 3ecb6382-a741-5704-9797-b2b8d70847c1  .../secure-qdrant/#step-3-enable-an-admin-api-key
```

## Digests: One Number per Bucket

Each chunk contributes one number to its bucket: the chunk digest, computed from the chunk's ID and its content hash, which is a hash of two concatenated hashes. If the chunk's position and content stay the same, its digest stays the same. A bucket's digest is the XOR of the chunk digests in it:

```text
bucket 5 holds two chunks, each contributes a digest:
  chunk A  ->  0011
  chunk B  ->  0101
  digest   =   0011 XOR 0101  =  0110

edit chunk B's text, so its chunk digest changes:
  chunk B  ->  1001
  digest   =   0011 XOR 1001  =  1010      (changed: bucket 5 gets investigated)
```

Because the chunk digest folds in both the ID and the text, any edit, insert, or delete in a bucket changes its digest, and an untouched bucket keeps exactly the same digest. The collision probability is around 2^-60, which is negligible. That's the signal you compare on.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="digests" >}}

For the three sample chunks, `compute_digests` returns a 16-element list with three non-zero entries, at positions 1, 11, and 12:

```text
[0, 1065001772501011583, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 361274710181928245, 526478318249294445, 0, 0, 0]
```

## Storing the Chunks

The chunks collection is the one from the first tutorial with one addition: each point carries its `sync_bucket` in the payload, and that field is indexed so you can read a single bucket without scanning the collection.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="create-collection" >}}

The [collection metadata](/documentation/manage-data/collections/#collection-metadata) guardrail from the first tutorial still applies. Record which embedding model and which pipeline version produced the points, and if either changed, re-embed the whole collection instead of running an incremental sync. Bucket digests are computed from text and addresses, not from vectors, so they won't catch a model swap.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="payload" >}}

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="populate" >}}

## The Summary Collection of Digests

The digests live in Qdrant, in a small separate collection.

The obvious layout is one point per bucket, but at real scale that's a lot of points (around 65,000 for 2^16 buckets), and reading the whole summary would mean fetching all of them on every run. So pack several bucket digests into each point instead, balancing the number of reads against the cost of rewriting a point when one of its buckets changes. For the 2^16 example, 256 points holding 256 digests each covers all 65,536 buckets. A bucket's digest then sits at `point = bucket // 256`, `slot = bucket % 256`.

This tutorial uses 16 buckets in four groups of four:

```text
  point 0  =  digests for buckets 0, 1, 2, 3
  point 1  =  digests for buckets 4, 5, 6, 7
  point 2  =  digests for buckets 8, 9, 10, 11
  point 3  =  digests for buckets 12, 13, 14, 15

a bucket's digest sits at   point = bucket // 4,   slot = bucket % 4
```

Each digest is a 60-bit number, which fits Qdrant's signed 64-bit integer payload, so digests are stored as plain integers. The vectors can be dummy one-dimensional values, since this collection is never searched. It only serves lookups by ID.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="summary-collection" >}}

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="summary-read-write" >}}

## Syncing With Documentation Changes

Your sync trigger is the same as before: a CI job on merge if your docs live in git, or a nightly cron job.

A sync run reconciles the collection with the current source in five steps:

1. Compute the digest summary from the current source.
2. Read the stored summary from the summary collection.
3. Take the buckets where the two differ.
4. Reconcile each changed bucket against the source, comparing by content hash.
5. Rewrite the summary, for the changed groups only, after the data writes.

Reconciling one bucket is a set difference between the source and what Qdrant stores:

```text
bucket 11:   step-2 new_hash   vs   step-2 old_hash    ->  changed  ->  re-embed
bucket 0:    step-4 hash       vs   (absent)           ->  new      ->  embed + insert
bucket 12:   (absent)          vs   step-3 hash        ->  gone     ->  delete
```

Step 5 runs after the writes on purpose. If a run stops halfway, the stored summary still points at the unfinished bucket, so the next run redoes it. Redoing is harmless, because the writes are keyed by ID and content hash.

The rest of this section builds the pipeline one function at a time.

### The Edited Source

Here's the source after a month of edits. The `prerequisites` chunk is unchanged, `step-2` was edited, `step-3` is gone, and a new `step-4` appeared.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="latest-chunks" >}}

### Steps 1 to 3: Which Buckets Changed

Compute the digest summary from the edited source, read the stored summary, and take the buckets where they differ. This reads only the small summary collection. The chunks collection isn't touched yet.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="changed-buckets" >}}

```text
[0, 11, 12]
```

Three buckets out of 16, one per change. The unchanged `prerequisites` chunk sits in bucket 1, which isn't in the list, so nothing in it will be read.

### Reading One Bucket

`read_bucket` returns the chunks currently stored in one bucket as a mapping from `point_id` to `content_hash`. It filters on the indexed `sync_bucket` field, so Qdrant reads that one bucket rather than the whole collection, and it pages through the results so nothing is missed in a large bucket.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="read-bucket" >}}

Calling `read_bucket(11)` returns the one chunk Qdrant holds there, `step-2`, with the fingerprint of its pre-edit text:

```text
{'4e72de03-624c-5b8e-a3ef-93e3a2d3267b': '5f10768bbae2b0a5b3c6bc53947fd9e920411897aba9b3280e12ab704fdc65fb'}
```

### Reconciling One Bucket

`reconcile_bucket` takes a bucket number and the source chunks in that bucket, and makes Qdrant match. It set-diffs the source against what's stored: chunks that are new or whose content hash changed get embedded and upserted, and chunks the source no longer has get deleted. It returns the counts of what it did.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="reconcile-bucket" >}}

### The Whole Run

`sync` groups the source by bucket once, finds the changed buckets by comparing summaries, reconciles each one, then rewrites only the changed groups of the summary, last.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="sync" >}}

## Run and Verify the Sync

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates-at-scale/" block="run-sync" >}}

You should see something like:

```text
{'changed_buckets': [0, 11, 12], 'added': 1, 're_embedded': 1, 'deleted': 1}
```

`changed_buckets` lists only the buckets holding an edit, insert, or delete, and only the edited and new chunks were re-embedded. Re-running the same sync input should report an empty `changed_buckets` and zeros across the board, without reading a single point from the chunks collection.

## What This Design Trades Away

The first tutorial handles a fifth case that this one doesn't: content that moved. When a page is renamed, every chunk on it gets a new address and therefore a new point ID, while the text stays identical. The first tutorial looks the text up by `content_hash`, finds the old point, and copies its vector into the new point instead of paying to embed it again.

Here, a moved chunk leaves one bucket and arrives in another, both buckets show up as changed, and `reconcile_bucket` treats the arrival as new and embeds it. Correct, but wasteful on a large page move.

You can get the vector reuse back cheaply. Index `content_hash` in the chunks collection, and before embedding the chunks that `reconcile_bucket` classified as new, [scroll](/documentation/manage-data/points/) for a point carrying the same hash. On a hit, copy the stored vector. This runs once per genuinely new chunk per run, not once per chunk in the corpus, so the cost tracks the change set rather than the corpus. Order matters: do the lookups before the deletions in the same run, or the vectors you want to copy will already be gone.

## Guardrails

Most of the operational advice from the first tutorial carries over.

Take a [snapshot](/documentation/snapshots/) before a sync run and delete it once the run looks fine. Put a ceiling on deletions per run, and skip the deletion step and investigate if a run wants to remove a suspiciously large share of the collection. Refuse to sync an empty input list, since an empty source makes every bucket look changed and every point look gone.

Frequent re-embeddings and deletions don't degrade the index over time. Background [optimizers](/documentation/ops-optimization/optimizer/) rebuild and merge index segments as changes accumulate.

Pick the bucket count so that a bucket stays small, in the range of tens of chunks, and raise it as the corpus grows. Changing `N_BUCKETS` reshuffles every chunk, so treat it as a full rebuild: recompute `sync_bucket` for every point and rewrite the summary from scratch.

Run one sync at a time. If your pipeline can't guarantee that, look at [conditional updates](/documentation/manage-data/points/#conditional-updates) and [update modes](/documentation/manage-data/points/#update-mode) for per-write preconditions.

## Conclusion

Each chunk gets a bucket from its address and a digest from its ID and text. One small collection holds the XOR digest of each bucket. Every run compares the current digests against the stored ones and reconciles only the buckets that differ. Reads and re-embeddings then track how much changed, not how big the corpus is.

Use the [first tutorial](/documentation/tutorials-operations/incremental-embedding-updates/) when the corpus is small, up to roughly 100,000 chunks. Fewer moving parts, nothing extra to maintain, and it handles moved content for free.

Use this design when the corpus is large and each run's changes are small next to its size, from around a million chunks up.

Related guides:

- Switching or upgrading the embedding model: [Embedding Model Migration](/documentation/tutorials-operations/embedding-model-migration/)
- Wholesale infrastructure swaps: [Blue-Green Deployment](/documentation/tutorials-operations/blue-green-deployment/)
- Sync driven by database change events: [Data Synchronization](/documentation/data-synchronization/)