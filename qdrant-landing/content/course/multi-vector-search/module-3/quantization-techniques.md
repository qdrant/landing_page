---
title: "Vector Quantization Techniques"
description: Learn how to reduce memory usage with scalar quantization, binary quantization, and other compression methods.
weight: 2
---

{{< date >}} Module 3 {{< /date >}}

# Vector Quantization Techniques

Vector quantization compresses vectors by reducing the precision of each component. Qdrant supports several quantization methods that can reduce memory usage by 4-64x, sometimes with minimal quality loss.

Choosing the right quantization method depends on your quality requirements and memory constraints.

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

**Follow along in Colab:** <a href="https://colab.research.google.com/github/qdrant/examples/blob/master/course-multi-vector-search/module-3/quantization-techniques.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" style="display:inline; margin:0;" alt="Open In Colab"/>
</a>

---

## The Memory Challenge with Multi-Vector Models

By default, embedding models produce vectors with **float32 precision** - each component uses 32 bits (4 bytes) of memory. For single-vector embeddings, this is manageable. But multi-vector models like **ColModernVBERT** change the equation dramatically.

Consider a typical ColPali scenario using **ColModernVBERT**:
- **~1024 vectors per document** (one per visual patch)
- **128 dimensions per vector** (model embedding size)
- **float32 precision** (4 bytes per component)

Let's calculate the memory for a single document:

$$
\text{Memory per document} = 1024 \text{ vectors} \times 128 \text{ dims} \times 4 \text{ bytes} = 524{,}288 \text{ bytes} = 512 \text{ KB}
$$

For a collection of **1 million documents**:

$$
\text{Total memory} = 1{,}000{,}000 \times 512 \text{ KB} = 512 \text{ GB}
$$

Compare this to a traditional single-vector model (e.g., 768-dimensional):

$$
\text{Single-vector memory} = 768 \text{ dims} \times 4 \text{ bytes} = 3{,}072 \text{ bytes} = 3 \text{ KB per document}
$$

**Multi-vector representations use ~170x more memory** than single-vector models for the same number of documents. This is where quantization becomes essential.

## Quantization: Compressing Without Losing Quality

**Vector quantization** reduces memory by representing vectors with fewer bits while preserving the relative distances between them. Qdrant supports several quantization methods optimized for different scenarios.

**Important: What Quantization Does (and Doesn't) Do**

Quantization is a **memory optimization technique**, not an indexing solution:
- ✅ **Reduces memory footprint** by 4-32x for storing multi-vector representations
- ✅ **Reduces infrastructure costs** by requiring less RAM
- ✅ **Provides speed improvements** through SIMD operations and smaller data transfers
- ❌ **Does NOT enable HNSW indexing** for multi-vector search - brute force scan is still required

Multi-vector search with MaxSim fundamentally requires comparing query tokens against all document tokens. HNSW and other graph-based indexes cannot efficiently navigate this token-level comparison space. Quantization makes the brute force search faster and cheaper, but the search strategy remains exhaustive.

The key insight: **you don't need perfect precision to find the right matches**. If document A is closer to a query than document B in full precision, it usually remains closer after quantization.

### Scalar Quantization: The Reliable Default

**Scalar quantization** converts float32 values to 8-bit integers (uint8), reducing memory by **4x**.

**How it works:**
1. Find the min and max values across all vector components
2. Map the float range to [0, 255]
3. Store the scaling parameters for reconstruction

For our ColModernVBERT example:

$$
\text{Quantized memory} = \frac{512 \text{ GB}}{4} = 128 \text{ GB}
$$

**Benefits:**
- **4x memory reduction** with <1% accuracy loss
- **Up to 2x faster brute force search** via SIMD optimization (still exhaustive, but more efficient)
- **Lower infrastructure costs** by reducing RAM requirements
- Works universally across all vector types and dimensions

**Configuration parameter:**
- `quantile`: Excludes outliers (e.g., 0.99 excludes 1% of extreme values for better scaling)

### Binary Quantization: Maximum Compression

**Binary quantization** represents each component as a single bit (positive/negative), achieving **32x compression**. Qdrant also supports **1.5-bit** and **2-bit** variants for better accuracy with moderate compression.

For ColModernVBERT vectors:

**1-bit binary quantization:**

$$
\text{Memory per document} = 1024 \text{ vectors} \times 128 \text{ dims} \times \frac{1}{8} \text{ bytes} = 16{,}384 \text{ bytes} = 16 \text{ KB}
$$

$$
\text{Total for 1M docs} = \frac{512 \text{ GB}}{32} = 16 \text{ GB}
$$

**1.5-bit binary quantization:**

$$
\text{Total for 1M docs} = \frac{512 \text{ GB}}{24} \approx 21.3 \text{ GB}
$$

**2-bit binary quantization:**

$$
\text{Total for 1M docs} = \frac{512 \text{ GB}}{16} = 32 \text{ GB}
$$

**Typical dimension ranges for binary quantization:**
- **1-bit**: Often used with high-dimensional vectors (1536+ dimensions)
- **1.5-bit**: Commonly applied to 1024-1536 dimensions
- **2-bit**: Frequently used with 768-1024 dimensions

For ColModernVBERT's **128 dimensions**, binary quantization presents unique challenges. With such low dimensionality, each bit of precision has a larger impact on the representation. The choice between scalar and binary quantization - and which binary variant to use - depends on your specific use case and quality requirements. We'll explore how to evaluate these trade-offs systematically in the final lesson of this module.

### Real-World Impact for ColPali Collections

Let's compare all options for a **1 million document** ColModernVBERT collection:

| Method               | Memory  | Compression   | Speed Boost |
|----------------------|---------|---------------|-------------|
| **No quantization**  | 512 GB  | 1x (baseline) | 1x          |
| **Scalar (int8)**    | 128 GB  | 4x            | ~2x         |
| **Binary (2-bit)**   | 32 GB   | 16x           | ~20x        |
| **Binary (1.5-bit)** | 21.3 GB | 24x           | ~30x        |
| **Binary (1-bit)**   | 16 GB   | 32x           | ~40x        |

<aside role="status">
<b>Note:</b> The "Speed Boost" column refers to improvements in brute force search performance. Quantization does not enable HNSW or other graph-based indexing for multi-vector search - all documents are still scanned exhaustively. The speed improvements come from faster distance computations and reduced memory bandwidth requirements during the brute force scan.
</aside>

The table above shows the theoretical memory savings and search performance characteristics for each quantization method. The actual impact on retrieval quality is **not included** because it varies significantly based on your specific documents, queries, and quality requirements.

**The choice between these methods requires systematic evaluation** of your complete search pipeline. We'll cover evaluation methodologies in detail in the final lesson of this module, where you'll learn how to measure the impact of quantization on your specific use case.

## Enabling Quantization in Qdrant

One of Qdrant's powerful features: **you can enable quantization on an existing collection** without changing your inference or ingestion pipelines. The quantization happens transparently during indexing.


First, let's load the ColPali model and prepare some sample documents:

```python
from fastembed import LateInteractionMultimodalEmbedding

# Load ColPali model for generating multi-vector embeddings
model = LateInteractionMultimodalEmbedding(
    model_name="Qdrant/colpali-v1.3-fp16"
)

# Sample document images and metadata
image_paths = [
    "images/financial-report.png",
    "images/titanic-newspaper.jpg",
    "images/moon-landing.jpg",
    "images/einstein-newspaper.jpg",
]

documents = [
    {"title": "Financial Report", "type": "report", "topic": "finance"},
    {"title": "Titanic Sinking", "type": "newspaper", "topic": "history"},
    {"title": "Moon Landing", "type": "newspaper", "topic": "space"},
    {"title": "Einstein Theory", "type": "newspaper", "topic": "science"},
]

# Generate embeddings for all images
image_embeddings = list(model.embed_image(image_paths))
```

Now create a collection with scalar quantization:

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333")

client.create_collection(
    collection_name="colpali-scalar",
    vectors_config={
        "colpali": models.VectorParams(
            size=128,
            distance=models.Distance.DOT,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
            hnsw_config=models.HnswConfigDiff(m=0),  # Disable HNSW for multi-vector
        ),
    },
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            quantile=0.99,  # Exclude 1% outliers for better scaling
            always_ram=True,
        ),
    ),
)
```

Ingest the documents into the scalar-quantized collection:

```python
client.upsert(
    collection_name="colpali-scalar",
    points=[
        models.PointStruct(
            id=i,
            vector={"colpali": embedding.tolist()},
            payload=documents[i],
        )
        for i, embedding in enumerate(image_embeddings)
    ],
)
```

Enabling a different type of quantization requires setting a different quantization configuration.

```python
client.create_collection(
    collection_name="colpali-binary",
    vectors_config={
        "colpali": models.VectorParams(
            size=128,
            distance=models.Distance.DOT,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            ),
            hnsw_config=models.HnswConfigDiff(m=0),
        ),
    },
    quantization_config=models.BinaryQuantization(
        binary=models.BinaryQuantizationConfig(
            always_ram=True,
        ),
    ),
)

# Ingest the same data into the binary-quantized collection
client.upsert(
    collection_name="colpali-binary",
    points=[
        models.PointStruct(
            id=i,
            vector={"colpali": embedding.tolist()},
            payload=documents[i],
        )
        for i, embedding in enumerate(image_embeddings)
    ],
)
```

## Search-Time Control with Rescoring

Qdrant provides **automatic rescoring**: the quantized index quickly finds candidates, then re-ranks them using the original float32 vectors for accuracy.

**Key search parameters:**
- `rescore`: Re-evaluate top candidates with original vectors (default: true)
- `oversampling`: Fetch more candidates before rescoring (e.g., 2.0 = fetch 2x results)

For ColPali searches:

```python
# Generate query embeddings from a text query
query = "financial quarterly results revenue"
query_embeddings = list(model.embed_text([query]))[0]

# Search with rescoring enabled
results = client.query_points(
    collection_name="colpali-scalar",
    query=query_embeddings.tolist(),
    using="colpali",
    limit=10,
    search_params=models.SearchParams(
        quantization=models.QuantizationSearchParams(
            ignore=False,       # Use quantized vectors for initial search
            rescore=True,       # Re-rank with original float32 vectors
            oversampling=2.0,   # Fetch 2x candidates before rescoring
        ),
    ),
)
```

The rescoring step is **critical for multi-vector search** because MaxSim aggregates many token-level similarities - small quantization errors can compound. Rescoring with original vectors ensures your final results maintain high quality.

## Quantization Impact on Search Quality

The compression ratios and speed improvements shown above are only part of the story. **The real question is how quantization affects your retrieval quality** - and that answer depends entirely on your specific use case.

Several factors influence quantization's impact:

1. **Model dimensionality** - ColModernVBERT's 128-dimensional vectors behave differently under quantization than higher-dimensional models (768+ dims)
2. **Document characteristics** - Text-heavy documents, image-heavy pages, and structured forms each respond differently to compression
3. **Query patterns** - Keyword-like queries vs. semantic questions may show different sensitivity to quantization errors
4. **Quality thresholds** - Your application's tolerance for retrieval quality changes

Published benchmarks provide general guidance, but **your specific documents and queries will behave differently**. A quantization method that works well for one dataset might perform poorly on another.

This is why the final lesson in this module focuses entirely on **evaluating multi-vector search pipelines**. You'll learn systematic approaches to measure quantization's impact on your specific use case, helping you make informed trade-offs between memory savings and retrieval quality.

## What's Next

In this lesson, you learned how quantization dramatically reduces memory usage and improves brute force search performance for multi-vector representations. Key takeaways:
- ColModernVBERT's memory footprint: **512 KB per document** without quantization
- Scalar quantization reduces this to **128 KB** (4x compression) with ~2x faster brute force search
- Binary quantization can achieve **16-32 GB** total memory for 1 million documents (vs 512 GB uncompressed) with up to 40x faster brute force search
- **Quantization is a memory and speed optimization**, not an indexing solution - HNSW remains incompatible with multi-vector search
- The search strategy remains exhaustive (brute force), but becomes significantly cheaper and faster

Crucially, **quantization can be enabled on existing collections** without modifying your ingestion or inference code, making it straightforward to experiment with different approaches.

However, choosing the right quantization method requires measuring its impact on your specific retrieval quality. We'll cover systematic evaluation approaches in the final lesson of this module.

Next, we'll explore **pooling techniques** that reduce the number of vectors per document - a complementary approach to reducing memory that works alongside quantization.
