---
title: "Knowledge Check"
short_description: "Module 5 of the Beginner Course: check the capstone before you call it done."
description: "Work through these questions on named vectors, payload indexes, and clustering before you call the capstone project complete."
weight: 8
isLesson: true
---

{{< date >}} Module 5 {{< /date >}}

# Knowledge Check

Work through these before you call the capstone done.

<details>
<summary>Why does the collection use named vectors instead of one collection per modality?</summary>

One signal, one point. A single event can carry text and image evidence at the same time, and named vectors keep all of it on that one point, queryable separately, sharing a single payload for filtering. Splitting by modality would scatter one event across collections, duplicate the filtering logic, and leave you joining results in application code.

</details>

<details>
<summary>A satellite image is ingested with no caption. Which parts of this system stop working for it, and why?</summary>

It gets an <code>image</code> vector and nothing else. Image search still finds it, because CLIP matches the query text to the picture. But it has no <code>text_dense</code> vector, so <code>dense_matrix</code> skips it and it can never join a text cluster, and no text query will reach it. That is why the ingestion pipeline captions images rather than treating the caption as optional metadata.

</details>

<details>
<summary>How does CLIP match the query "smoke above factory" to a satellite photo with no text attached?</summary>

CLIP is trained on image and caption pairs, which places pictures and text in one shared embedding space. FastEmbed exposes the two halves separately: <code>Qdrant/clip-ViT-B-32-vision</code> embedded the photo, and <code>Qdrant/clip-ViT-B-32-text</code> has to embed the query so it lands in the same space. Using <code>all-MiniLM-L6-v2</code> instead produces a 384-dimensional vector in an unrelated space, and the query fails on dimension or returns noise.

</details>

<details>
<summary>Why are there three named vectors rather than one per signal source?</summary>

Because two of the sources are not new modalities. A transcript is text the moment it has been transcribed, and a video frame is an image the moment it has been sampled, so both reuse spaces that already exist. Adding a separate vector for transcripts would mean two named vectors holding the same 384-dimensional MiniLM embedding of the same words, with no query able to tell them apart.

</details>

<details>
<summary>In a hybrid query, where does the filter belong?</summary>

Inside each <code>Prefetch</code>. Each retriever searches only the signals that satisfy the filter, so its 50 candidates are scoped before fusion ranks them.

</details>

<details>
<summary>How would you extend this system to detect a risk theme affecting 15 suppliers at once?</summary>

Cluster across suppliers rather than within one: run <code>cluster_and_tag</code> over every signal from the last 24 to 48 hours with no <code>supplier_id</code> filter. A shared theme appears as one tight cluster drawing signals from many suppliers, and its centroid gives you a vector for the emerging narrative, which <code>signals_like_cluster</code> then uses to pull in everything else about it.

</details>

<details>
<summary>The capstone creates every payload index before ingesting anything. Why does the order matter more here than in a single-vector system?</summary>

Qdrant adds filter-aware edges to the HNSW graph from indexed payload values, and only for indexes that exist when the graph is built. An index created later still filters correctly, but earning those edges means rebuilding the graph. This collection has two dense graphs, one for <code>text_dense</code> and one for <code>image</code>, so a late index means rebuilding both. On Qdrant Cloud a missing index also fails loudly rather than slowly, since strict mode rejects filters on unindexed fields.

</details>
