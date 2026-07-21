---
title: Incremental Embedding Updates
short_description: "Sync embeddings with raw text data that changes over time."
description: "Keep embeddings in the Qdrant search engine in sync with documentation that changes over time, for up-to-date vector search."
weight: 32
---

# Incremental Embedding Updates

| Time: 25 min | Level: Beginner | Output: [GitHub](https://github.com/qdrant/examples/blob/master/temporal-data-drift/sync_raw_data_to_embeddings.ipynb) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://githubtocolab.com/qdrant/examples/blob/master/temporal-data-drift/sync_raw_data_to_embeddings.ipynb) |
| --- | ----------- | ----------- | ----------- |

Qdrant documentation [lives on GitHub](https://github.com/qdrant/landing_page), consisting mainly of markdown pages with embedded code snippets and visuals.  
Like any other documentation of an evolving product, it's not static: raw data in markdowns changes with time, and users searching across our documentation expect to find the latest state of it.  
If search over documentation uses vectors, as ours does, it requires additional setup and maintenance to fulfill this expectation.

## Vectors <-> Raw Data

Vectors are a transformation of raw data.
This transformation does not happen by itself when raw data changes. Unless vectors are updated proactively, documentation search would run against embeddings of text that no longer exists.    
There's a need for a re-embedding process, syncing vectors with raw data changes.

This tutorial provides a simple pipeline that, set up from day one, detects changes in your text data and executes incremental embedding updates.
It reconciles a complete, current list of Qdrant documentation chunks with a Qdrant collection. Each run:

1. leaves unchanged chunks untouched,
2. re-embeds changed text,
3. reuses a vector when text changes location,
4. adds new text,
5. deletes text absent from the source list.

The pattern applies when your chunking is deterministic and enumerating the current source is inexpensive.

The tutorial has an accompanying [notebook](https://github.com/qdrant/examples/blob/master/temporal-data-drift/sync_raw_data_to_embeddings.ipynb).

## Prerequisites

Install the [Qdrant client of your choice](/documentation/interfaces/#client-libraries).

We use Qdrant Cloud and its [Free Embedding Inference](/documentation/cloud/inference/#free-embedding-models).  
Create a Free Tier [Qdrant Cloud cluster](https://cloud.qdrant.io/) and set `QDRANT_URL` and `QDRANT_API_KEY` in your environment.


{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="client-connection" >}}

## The Data: Qdrant Documentation

Let's look at the [operations tutorials](/documentation/tutorials-operations/) tab. Here's an example of a real change: this tutorial became a part of this tab, so our collection of vectors used for documentation search will have to be updated.

Let's consider a simple documentation hierarchy:

1. We have one page behind one `url`: https://qdrant.tech/documentation/tutorials-operations/secure-qdrant
2. A page consists of sections. For example, the ["Step 2: Enable TLS" section](/documentation/tutorials-operations/secure-qdrant/#step-2-enable-tls). A section is marked by an `anchor`, generated from the heading text: "Step 2: Enable TLS" -> the "#step-2-enable-tls" part of the `section_url`.

Let's break down documentation using this hierarchy. Some sections might not fit the embedding model context window limit (how big of a text it can represent). We'll split them into chunks, numbered `0, 1, 2…`. For minimal hierarchy awareness, a chunk keeps its section heading prepended.

```text
page https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/ (url)
├── section  #prerequisites (anchor)
│   └── chunk_num 0  "Prerequisites - Docker and Docker Compose installed..."
├── section  #secure-a-self-hosted-qdrant-instance (anchor)
│   ├── chunk_num 0  "Secure a Self-Hosted Qdrant Instance | Time: 45 min..."
│   └── chunk_num 1  "Secure a Self-Hosted Qdrant Instance > Qdrant Cloud..."
├── section  #step-1-start-an-unsecured-instance (anchor)
│   └── chunk_num 0  "Step 1: Start an Unsecured Instance Start Qdrant..."
├── section  #step-2-enable-tls (anchor)
│   └── chunk_num 0  "Step 2: Enable TLS Unencrypted connections allow..."
└── ...
```

So one page produces a set of chunks of the form: `{url, anchor, chunk_num, text}`. One vector = one section chunk.

<details>
<summary>CHUNKS list used in this tutorial: three real tutorials from the operations tab chunked</summary>

```python
CHUNKS = [  # three tutorials: secure-qdrant, migration, time-based-sharding
 {
  "url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
  "anchor": "prerequisites",
  "chunk_num": 0,
  "text": "Prerequisites - Docker and Docker Compose installed - `curl` available in your terminal - mkcert for generating a local self-signed certificate (installation instructions) - TLS requires Qdrant 1.2 or later, API key authentication requires Qdrant 1.2 or later, and granular access API keys (JWT) require Qdrant 1.9 or later. This tutorial uses the latest Qdrant image, which includes all these features. ---"
 },
 {
  "url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
  "anchor": "secure-a-self-hosted-qdrant-instance",
  "chunk_num": 0,
  "text": "Secure a Self-Hosted Qdrant Instance | Time: 45 min | Level: Intermediate | ..."
 },
 # ... full list in the ipynb
]
```

</details>

For each chunk we assume some text normalization pipeline is in place, as:

- Noise in the text degrades the embedding
- Noise costs re-embedding when it's not needed (for example, someone added a trailing space)

```text
normalize(text):
    - remove invisible characters (zero-width spaces, byte-order mark, soft hyphen)
    - collapse any whitespace run into a single space
    - ...
```

## Configuring Collection

Let's configure a collection for chunks.

We'll use `sentence-transformers/all-MiniLM-L6-v2`: it's one of the [free embedding models](/documentation/cloud/inference/#free-embedding-models) on Qdrant Cloud Inference.  
Its output dimension is 384, its context window is 256 tokens, which is exactly why long sections got chunked above: over-window input is silently truncated.

### Collection Metadata

There are other types of drift harmful for production vector search, for example, a change in the embedding model version or in the data preparation pipeline.  
Vectors produced by different embedding models, or by the same model over differently prepared text, almost certainly should not mix in one collection: retrieval will degrade and it will be hard to detect why.

Let's consider a simple guardrail: save which model and which pipeline version produced the data points, in [**collection metadata**](/documentation/manage-data/collections/#collection-metadata), and verify against it. If one of the two changed, we need to trigger full collection re-embedding.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="create-collection" >}}

The gate against mixing embedding generations is then a simple check at the start of every run:

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="check-gate" >}}

## Characteristics of a Document Chunk

What usually happens to documentation?
Something completely new appears, information on pages gets fixed, pages get restructured and sections are moved as-is, pages get deleted.

It makes sense to monitor two independent characteristics of a document chunk:

- **Content**: the text we search against and generate the embedding from.
- **Position**: where the chunk lives, in our case its URL, anchor, and number.

Hence every record should get two derived values:

- **Content fingerprint**, like SHA-256 of the text. It changes if a single character changes, and never otherwise. Comparing fingerprints answers "*Is it the same content?*" without comparing texts.
- **Deterministic ID** for position in documentation. For example, `url + "#" + anchor + "::" + chunk_num` turned into a UUID, one of the two point ID formats Qdrant accepts. Comparing IDs answers "*Is this content still at the same position?*".

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="identity-and-fingerprint" >}}
Example:

```text
point ID: 2ff5204a-0353-5991-... # UUID(url + "#" + anchor + "::" + chunk_num)
text (to vectorize):         Prerequisites - Docker and Docker Compose...
content_hash:                27d55e75b962f1d5... # sha256(text)
```

Additionally, a point can be described by the following fields:

**Payload:**
- `url`: filter or group all chunks of one page
- `section_url`: filter or group all chunks of one section
- `last_updated`: when content of this chunk last changed (or was created)

<details>
<summary>payload() implementation</summary>

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="payload" >}}

</details>

For all the payload fields used for filtering or grouping we need to create a [**payload index**](/documentation/manage-data/indexing/).

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="payload-indexes" >}}

## Populate Collection

Populate the collection with the whole documentation.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="populate" >}}

<details>
<summary>Test the search against it</summary>

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="search" >}}

You should get something like:

```text
0.675  https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/#secure-a-self-hosted-qdrant-instance
       Secure a Self-Hosted Qdrant Instance | Time: 45 min | Level: Intermediate | ...
```

</details>

## Syncing with Documentation Changes

Your sync trigger could be a CI job on merge if your docs live in git, or a nightly cron job.

The input of every sync with a documentation collection here is the **current full chunk list of the docs**. For a simple deterministic data prep pipeline it's cheap to gather this full list once a day, saving you the headache of deriving raw changes.

Each incoming chunk is compared against the current documentation collection in one of the following ways, based on the `point ID` (the chunk's address in documentation) and `content_hash` (the chunk's exact content, its fingerprint):

```text
incoming chunk
├─ ID found in the collection?
│   ├─ yes: fingerprint equal?
│   │   ├─ yes -> unchanged: the point stays as is
│   │   └─ no  -> content changed: re-embed in place
│   └─ no: identical fingerprint under another ID?
│       ├─ yes -> address changed: reuse the vector, create a new point
│       └─ no  -> new: embed and insert a new point
└─ stored point whose ID is absent from the incoming list
                -> gone: delete (last, after all writes)
```

**Note:** Optional safety net: take a [snapshot](/documentation/snapshots/) before sync, delete it later when everything looks fine.

### Input of a Sync Pipeline

Let's consider some possible changes:

- adding to the ["Secure a Self-Hosted Qdrant Instance" tutorial](/documentation/tutorials-operations/secure-qdrant/) a new small section "Step 6: Rotate API keys", 
  with the "Step 3" section now pointing to it
- the [migration page](/documentation/tutorials-operations/migration/) moved to a new URL
- the ["Time-based sharding" tutorial](/documentation/tutorials-operations/time-based-sharding/) was removed

<details>
<summary>The LATEST_CHUNKS list with these three changes</summary>

```python
untouched_secure_qdrant = [
    c for c in CHUNKS
    if c["url"] == "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/"
    and c["anchor"] != "step-3-enable-an-admin-api-key"
]

# now points to the new section
step_3 = {
 "url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
 "anchor": "step-3-enable-an-admin-api-key",
 "chunk_num": 0,
 "text": "Step 3: Enable an Admin API Key ... Refer to Security > Authentication to learn more about admin API keys, including API key rotation. --- See also: rotating API keys."
}

# the new section
step_6 = {
 "url": "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
 "anchor": "step-6-rotate-api-keys",
 "chunk_num": 0,
 "text": "Step 6: Rotate API keys Rotate the admin API key on a schedule and immediately after any suspected exposure. Update every client before revoking the old key."
}

# the migration page moved: same texts, new addresses
moved = [
    {**c, "url": "https://qdrant.tech/documentation/tutorials-operations/migration-guide/"}
    for c in CHUNKS
    if c["url"] == "https://qdrant.tech/documentation/tutorials-operations/migration/"
]

# the time-based-sharding tutorial is absent from LATEST_CHUNKS - that is how a deletion arrives

LATEST_CHUNKS = prepare_chunks_for_sync(untouched_secure_qdrant + [step_3, step_6] + moved)
```

</details>

We now check every incoming chunk against the collection: does its ID (address) exist, and does its `content_hash` (exact text) match?

[`retrieve`](/documentation/manage-data/points/) fetches points by ID. At corpus scale you would batch the IDs.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="split-by-state" >}}

### Case 1: Unchanged, Do Nothing

These chunks carry the same fingerprint as before.

### Case 2: Content Changed, Re-Embed

The chunk about Step 3 exists under a known ID (it didn't change its position on the docs website) but carries new information.  
Use `upsert`: writing a point under an existing ID replaces it.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="re-embed-changed" >}}

### Cases 3 and 4: ID Is Not Present in the Collection

Six IDs are unknown to the collection, but an unknown ID does not necessarily mean new content. When a page moves as-is, every chunk on it gets a new address (a new ID), while the text stays exactly the same. Embedding it again would produce the same vector, so why pay for it.

A filtered [`scroll`](/documentation/manage-data/points/) on `content_hash` answers the question "*does this exact text already exist under some other ID?*". 
- On a hit, we copy the stored vector into the new point and keep the source's `last_updated` as the content did not change.
- On a miss, the content is genuinely new; we embed and insert a new point.

**Note:** *This version performs one hash lookup per unknown chunk so the decision is easy to inspect. In production, batch hash lookups and point upserts.*

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="reuse-or-add" >}}

What's important to notice: the old points, the migration page under its old URL, are still in the collection. They need to be removed, and that is the last case.

### Case 5: Gone, Delete

Whatever LATEST_CHUNKS does not contain no longer exists at the source. The deletion is one filtered call, "every point whose ID is *not* in the incoming list".

**Note:** *Deletion runs **last**, after all writes: hence if someone queries documentation at night while this pipeline runs, results for a second might be weird, as mid-run search here sees old and new content side by side:)*

**Note:** *It's a good practice to put some guardrails on the number of deletions before running it: if it is suspiciously large, you might want to skip deletion and investigate instead. Mind the edge case: an empty incoming list would match every point in the collection, so refuse to sync empty input.*

**Note:** Frequent re-embeddings and deletions don't degrade the index over time: background [optimizers](/documentation/ops-optimization/optimizer/) rebuild and merge index segments as changes accumulate.


{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="delete-gone" >}}

## Run and Verify the Sync

The five cases, assembled from the functions defined above:

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="sync" >}}

Run the sync.

{{< code-snippet path="/documentation/headless/snippets/tutorial-incremental-embedding-updates/" block="run-sync" >}}

You should see something like:

```text
{'unchanged': 9, 're-embedded': 1, 'reused_embedding': 5, 'added': 1, 'deleted': 20}
```

A re-run of the same sync input should change nothing: every change counter at zero, all 16 chunks in `unchanged`.

## Conclusion

A deterministic ID, a content fingerprint, and five sync cases keep embeddings in sync with changing raw data, re-embedding only what actually changed. Adapt this pipeline to your own documents.

Ways to make it better:

- Pipelines that risk concurrent iterative updates: see [conditional updates](/documentation/manage-data/points/#conditional-updates) and [update modes](/documentation/manage-data/points/#update-mode), per-write preconditions. This pipeline runs one sync at a time and does not need them.
- The `last_updated` field this sync maintains can power recency-aware ranking via [decay functions in a formula query](/documentation/search/search-relevance/).

Related guides:

- Switching or upgrading the embedding model: [Embedding Model Migration](/documentation/tutorials-operations/embedding-model-migration/)
- Wholesale infrastructure swaps: [Blue-Green Deployment](https://qdrant.tech/documentation/tutorials-operations/blue-green-deployment/)
- Sync driven by database change events: [Data Synchronization](/documentation/data-synchronization/)
