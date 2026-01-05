---
title: "Pooling Techniques"
description: Reduce the number of vectors per document using row/column pooling and hierarchical token pooling strategies.
weight: 3
---

{{< date >}} Module 3 {{< /date >}}

# Pooling Techniques

While quantization reduces the size of each vector, pooling reduces the number of vectors per document. By intelligently combining token embeddings, you can achieve significant memory savings while preserving retrieval quality.

---

<div class="video">
<iframe
  src="https://www.youtube.com/embed/xK9mV7zR4pL"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

---

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-3/pooling-techniques.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## Pooling in Embedding Models

Pooling isn't new to vector search - it's fundamental to how most embedding models work. When you encode text with models like Sentence Transformers, the model first generates embeddings for each token in your input. But to create a single vector representing the entire text, the model must **pool** these token embeddings together.

Common pooling strategies in dense embedding models include:

- **Mean pooling**: Average all token embeddings into a single vector
- **CLS token pooling**: Use the special `[CLS]` token's embedding as the document representation
- **Max pooling**: Take the maximum value for each dimension across all tokens
- **Weighted pooling**: Assign different importance to different tokens (e.g., using attention weights)

These techniques compress variable-length sequences of token embeddings into fixed-size vectors, making them compatible with traditional vector search systems.

With multi-vector representations, we face a similar but more nuanced challenge. Instead of reducing tokens to a single vector upfront, we maintain multiple vectors per document to preserve richer semantic information. However, as you learned in the previous lessons, this creates memory and performance challenges. **Pooling techniques for multi-vector search** let you strategically reduce the number of vectors while retaining the benefits of late interaction.

## Pooling for Multi-Vector Representations

### Image-Specific Methods

TODO: describe row/column pooling we can implement because of the spatial relationships in data

![Row/column pooling](/courses/multi-vector-search/module-3/row-column-pooling.png)

### Generic Methods

TODO: hierarchical token pooling as a universal method, based on clustering

## What's Next

TODO: summarize the lesson

Now let's tackle the indexing challenge with MUVERA, enabling fast approximate search for multi-vector representations.
