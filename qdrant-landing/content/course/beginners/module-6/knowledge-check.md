---
title: "Knowledge Check"
short_description: "Bonus module of the Beginner Course: test what you know about ranking, diversity, and grouping."
description: "Work through the traps in this module: an MMR recall drop, a decay term that decides every ranking, and a grouping request that returns a 400."
weight: 9
isLesson: true
---

{{< date >}} Module 6 {{< /date >}}

# Knowledge Check

<details>
<summary>You turn MMR on and your Recall@10 drops. Is MMR broken?</summary>

No. MMR spends result slots on documents further from the query, so a measure that only counts relevance goes down while the page stops repeating itself. Check what those slots held before: if they were eight versions of one story, the drop bought something your metric cannot see. If they were eight distinct relevant documents, lower `diversity`.

</details>

<details>
<summary>Your formula boosts newer articles on top of a hybrid query, and recency now decides every ranking. Why?</summary>

A decay term reaching 1.0 is the same size as the entire RRF score it is being added to, so it decides every comparison on its own. That ceiling rises with each extra prefetch, so measure your own fused scores rather than assuming 1.0.

</details>

<details>
<summary>You group results by <code>document_id</code> on a Qdrant Cloud cluster and the request returns a 400. What is missing?</summary>

A keyword payload index on `document_id`. Strict mode rejects the request without it, so the fix belongs on the field rather than in the query.

</details>

<details>
<summary>A reader clicks "more like this" on an article. You pass its point ID to the Recommendation API as a <code>positive</code> example, and the article itself never comes back. Is something broken?</summary>

No. A point passed in by ID is left out of the results, and here that is what you want, since the reader is already looking at it. When you do need it back, look the point up and pass its raw vector.

</details>

## Where to Go After the Course

- [Qdrant Essentials](/course/essentials/) goes deeper on HNSW tuning, quantization and rescoring, high-throughput ingestion, and the full Query API.
- [Multi-Vector Search](/course/multi-vector-search/) covers ColBERT and ColPali, including MaxSim scoring, pooling, and MUVERA indexing.
- [Tutorials](/documentation/tutorials-and-examples/) walk through complete, code-first implementations of the features in this module.
- [Qdrant Cloud](https://cloud.qdrant.io/) has a free cluster to run any of this on.
