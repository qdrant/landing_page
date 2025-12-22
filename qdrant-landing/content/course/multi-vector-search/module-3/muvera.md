---
title: "MUVERA"
description: Understand MUVERA and how it enables HNSW indexing for multi-vector search despite MaxSim asymmetry.
weight: 4
---

{{< date >}} Module 3 {{< /date >}}

# MUVERA

MUVERA (Multi-Vector Retrieval with Approximation) solves a fundamental problem: MaxSim's asymmetry makes traditional indexing methods like HNSW ineffective. MUVERA enables fast approximate search for multi-vector representations.

Understanding MUVERA is key to scaling multi-vector search to millions of documents.

---

<div class="video">
<iframe
  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

---

Next, we'll learn to combine all these optimizations in multi-stage retrieval pipelines using Qdrant's Universal Query API.
