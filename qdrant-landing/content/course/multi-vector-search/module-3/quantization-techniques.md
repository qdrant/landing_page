---
title: "Vector Quantization Techniques"
description: Learn how to reduce memory usage with scalar quantization, binary quantization, and other compression methods.
weight: 2
---

{{< date >}} Module 3 {{< /date >}}

# Vector Quantization Techniques

Vector quantization compresses vectors by reducing the precision of each component. Qdrant supports several quantization methods that can reduce memory usage by 4-32x with minimal quality loss.

Choosing the right quantization method depends on your quality requirements and memory constraints.

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

Next, we'll explore pooling techniques that reduce the number of vectors per document.
