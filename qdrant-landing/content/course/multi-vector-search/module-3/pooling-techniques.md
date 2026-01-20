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

For visual document representations like ColPali, spatial relationships in the patch grid enable effective pooling strategies. As you learned in Module 2's visual interpretability lesson, patches in the same row or column often capture semantically related content - a row might contain a line of text, while a column might capture a vertical element like a table border or sidebar.

**Row pooling** groups patches by their horizontal position:

1. Organize the 1024 patch embeddings into a 32×32 grid
2. Apply mean pooling across each row (combining 32 patches)
3. Result: 32 vectors instead of 1024

Mathematically:

<p>$$\text{RowPool}_i = \text{Mean}(\lbrace p_{i,j} : j \in [0, 31] \rbrace)$$</p>

Where $p_{i,j}$ is the patch embedding at row $i$, column $j$.

**Column pooling** works similarly but along the vertical axis:

<p>$$\text{ColPool}_j = \text{Mean}(\lbrace p_{i,j} : i \in [0, 31] \rbrace)$$</p>

This also produces 32 vectors, but captures vertical content relationships instead.

![Row/column pooling](/courses/multi-vector-search/module-3/row-column-pooling.png)

**Memory savings** are substantial:

| Representation | Vectors | Memory per Document |
|----------------|---------|---------------------|
| Full patches   | 1024    | 512 KB              |
| Row pooling    | 32      | 16 KB               |
| Column pooling | 32      | 16 KB               |

That's a **32× reduction** in vector count and memory footprint.

**Trade-offs to consider:**

- **Loss of fine-grained resolution**: Small details that span partial rows may blend together
- **Row pooling** works well for Western text documents where reading flows horizontally
- **Column pooling** better captures vertical structures like tables, sidebars, or Asian language text
- You can combine both (64 vectors) for a balanced approach

```python
# TODO: implement the code snippet
# - Reshape 1024 embeddings to 32×32 grid: embeddings.reshape(32, 32, 128)
# - Apply row pooling: embeddings.reshape(32, 32, 128).mean(axis=1) -> shape (32, 128)
# - Apply column pooling: embeddings.reshape(32, 32, 128).mean(axis=0) -> shape (32, 128)
# - Compare memory before/after
```

### Generic Methods

While row/column pooling exploits the spatial structure of image embeddings, **hierarchical token pooling** works for any multi-vector representation - text, images, or hybrid documents. The core idea: instead of grouping by fixed spatial positions, cluster tokens by **semantic similarity**.

**How hierarchical pooling works:**

1. Apply k-means clustering to group similar token embeddings
2. Pool within each cluster using mean pooling
3. Output: $k$ vectors instead of $n$ original tokens

This approach adapts to the content itself. For a document with dense text and sparse images, clustering naturally allocates more representative vectors to the text regions where semantic variation is higher.

**Key parameters:**

- **Number of clusters ($k$)**: Controls the compression ratio. $k=32$ gives similar compression to row pooling; $k=64$ preserves more detail
- **Clustering algorithm**: k-means is fast and effective; hierarchical clustering can capture nested semantic structures but adds overhead

**Comparison: Row/Column vs. Hierarchical Pooling**

| Aspect                | Row/Column Pooling                  | Hierarchical Pooling            |
|-----------------------|-------------------------------------|---------------------------------|
| **Works with**        | Images only (requires spatial grid) | Any multi-vector representation |
| **Grouping strategy** | Fixed spatial positions             | Semantic similarity             |
| **Compression ratio** | Fixed (32×)                         | Configurable via $k$            |
| **Indexing overhead** | None                                | Clustering computation          |
| **Preserves**         | Spatial structure                   | Semantic diversity              |

**Trade-offs:**

- **Higher indexing cost**: Clustering adds computational overhead during document encoding
- **Content-adaptive**: Allocates representation capacity where semantic variation is highest
- **Loses spatial interpretability**: Unlike row pooling, you can't easily map pooled vectors back to document regions
- **Hyperparameter sensitivity**: The choice of $k$ affects retrieval quality and must be tuned

```python
# TODO: implement the code snippet
# - Apply k-means clustering to embeddings: kmeans = KMeans(n_clusters=k).fit(embeddings)
# - Get cluster assignments: labels = kmeans.labels_
# - Pool within clusters: pooled = [embeddings[labels == i].mean(axis=0) for i in range(k)]
# - Compare retrieval quality across different k values
```

## What's Next

You've learned two complementary strategies for reducing the number of vectors per document:

- **Row/column pooling**: Exploits spatial structure in image embeddings for a fixed 32× reduction
- **Hierarchical pooling**: Content-adaptive clustering that works for any multi-vector representation

Combined with quantization from the previous lesson, you can achieve dramatic memory savings:

| Technique                         | Memory per Document |
|-----------------------------------|---------------------|
| Baseline (1024 vectors × float32) | 512 KB              |
| Row pooling only                  | 16 KB               |
| Row pooling + scalar quantization | 4 KB                |
| Row pooling + binary quantization | 512 bytes           |

That's a **1000× reduction** from baseline to the most aggressive combination - making multi-vector search practical even for large document collections.

However, there's still one challenge we haven't addressed: **indexing**. Even with pooled representations, we're still performing brute-force MaxSim comparisons. For millions of documents, this becomes a bottleneck.

In the next lesson, you'll learn about **MUVERA** - a technique that enables HNSW indexing for multi-vector representations, unlocking fast approximate search at scale.
