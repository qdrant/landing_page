---
title: "Late Interaction Basics"
description: Understand the late interaction paradigm and how it differs from traditional dense embeddings for text search.
weight: 1
---

{{< date >}} Module 1 {{< /date >}}

# Late Interaction Basics

Traditional dense embedding models compress entire documents into single vectors. The late interaction paradigm takes a different approach: it represents documents as sets of token-level vectors and delays the interaction computation until search time.

This fundamental shift enables more nuanced matching between queries and documents, capturing fine-grained semantic relationships that single vectors might miss.

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

Next, you'll learn about MaxSim, the distance metric that powers late interaction search.
