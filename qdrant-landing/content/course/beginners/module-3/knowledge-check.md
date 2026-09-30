---
title: "Knowledge Check"
short_description: "Module 3 of the Beginner Course: test what you know about dense, sparse, and hybrid retrieval."
description: "Work through retrieval failures and decide what to add and why, before you move on to designing a full system."
weight: 8
isLesson: true
---

{{< date >}} Module 3 {{< /date >}}

# Knowledge Check

**Q: A shopper searches your catalog for `iPad Air`, and dense-only search returns `iPad Mini` first. Both are reasonable matches for the words, but the ranking is wrong. What would you add, and why would it fix this specific failure?**

<details>
<summary>Show answer</summary>

Add sparse (BM25) retrieval alongside dense, combined through hybrid search. Dense embeds the whole phrase into one vector, so "Air" and "Mini" barely move the score, the same failure mode as Pegasus 40 versus 41. Sparse treats "Air" and "Mini" as distinct tokens with no relationship, so it separates the two products cleanly. Hybrid fusion lets the sparse side catch what dense alone misses.

</details>

**Q: Two products differ only by a rare model suffix, and your BM25 sparse vectors give every token in the title the exact same weight. A teammate says BM25 is broken and suggests switching to SPLADE. What do you tell them?**

<details>
<summary>Show answer</summary>

BM25 is not broken. It stores only the token-frequency half of the score by design; the half that discounts common tokens and rewards rare ones is applied at query time. Check the sparse vector config for `modifier=models.Modifier.IDF` before assuming the model needs replacing.

</details>

**Q: You are comparing a dense score of 0.87 to a BM25 score of 3.84 to decide which retriever's result to trust more. What is wrong with that comparison, and how does RRF sidestep the problem?**

<details>
<summary>Show answer</summary>

The two scores live on unrelated scales, so treating one as "stronger" than the other is meaningless. RRF avoids the comparison entirely: it merges candidates by rank position rather than raw score, so results from retrievers with incompatible scales can still be combined consistently.

</details>

**Q: You add a `brand` field to every product and filter on it. Every query now returns a `400` error from your Qdrant Cloud cluster. What is missing?**

<details>
<summary>Show answer</summary>

A payload index on `brand`. Qdrant Cloud runs strict mode by default. It rejects a filter on an unindexed field instead of scanning every point to answer it. Create the index with `create_payload_index`. Create it before ingesting where you can, so Qdrant builds it as it writes the data.

</details>
