---
title: Vector Quantization Methods
weight: 2
---

{{< date >}} Day 4 {{< /date >}}

# Vector Quantization Methods

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/oExGyAEOpP4"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

Production vector search engines face an inevitable scaling challenge: memory requirements grow with dataset size, while search latency demands vectors remain in fast storage. [Quantization](/documentation/guides/quantization/) provides the solution by compressing vector representations while maintaining retrieval quality - but the method you choose fundamentally determines your system's performance characteristics.

## The Memory Economics

Consider the mathematics of scale. OpenAI's `text-embedding-3-small` produces 1536-dimensional vectors requiring 6 KB each (1536 × 4 bytes per float32). This scales predictably: 1 million vectors consume 6 GB, 10 million require 60 GB, and 100 million demand 600 GB of memory.

For production RAG systems serving real-time queries, these vectors must reside in RAM or high-speed SSD storage. At cloud pricing, this translates to substantial infrastructure costs - hundreds to thousands of dollars monthly for enterprise-scale deployments.

Quantization breaks this cost scaling by compressing vectors while maintaining search effectiveness. The three primary quantization families - scalar, binary, and product - offer different points on the speed-memory-accuracy tradeoff curve, each optimized for specific deployment scenarios.

## Scalar Quantization

[Scalar quantization](/articles/scalar-quantization/) maps each float32 dimension (4 bytes) to an int8 representation (1 byte), achieving 4x memory compression through learned range mapping. The algorithm analyzes your vector distribution and determines optimal bounds - typically using quantiles to exclude outliers - then linearly maps the float32 range to the int8 range (-128 to 127).

The technique leverages SIMD optimizations available for int8 operations, enabling up to 2x speed improvements beyond the memory benefits. Distance calculations using int8 values are computationally simpler than float32 operations, particularly for dot product and cosine similarity computations that dominate vector search workloads.

Scalar quantization excels as the production default because it [maintains 99%+ accuracy](/articles/scalar-quantization/) across diverse embedding models while providing predictable compression ratios. Unlike binary quantization, which requires specific model characteristics, scalar quantization works reliably with embeddings from commercial providers (OpenAI, Cohere, Anthropic) and open-source models alike.

```python
from qdrant_client import QdrantClient, models
import os
from dotenv import load_dotenv

load_dotenv()
client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))

# Scalar quantization setup
client.create_collection(
    collection_name="scalar_collection",
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE,
        on_disk=True,  # Move originals to disk
    ),
    quantization_config=models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            quantile=0.99,  # Exclude extreme 1% of values
            always_ram=True,  # Keep quantized vectors in RAM
        )
    ),
)
```

> [Check out](/documentation/guides/quantization/#setting-up-scalar-quantization) how to set up scalar quantization in **TypeScript**, **Rust**, **Java**, **C#**, and **Go** clients.

## Binary Quantization

[Binary quantization](https://youtu.be/wRnSDDzLQmk) represents the extreme compression approach, reducing each dimension to a single bit through sign-based thresholding: values greater than zero become 1, values less than or equal to zero become 0. This transforms a 1536-dimensional vector from 6 KB (1536 × 4 bytes) to 192 bytes (1536 bits ÷ 8), achieving 32x memory compression.

The computational advantages are substantial. Bitwise operations enable distance calculations using native CPU instructions, delivering up to 40x speed improvements over float32 computations. Modern processors excel at parallel bitwise operations, making binary quantization particularly effective for high-throughput search scenarios.

However, binary quantization demands specific model characteristics for optimal performance. The technique works best with high-dimensional vectors (≥1024 dimensions) that exhibit centered value distributions around zero. Models like OpenAI's text-embedding-ada-002 and Cohere's embed-english-v2.0 have been validated for binary compatibility, but other models may experience significant accuracy degradation.

> **<font color='red'>Update:</font>** Starting from Qdrant **v1.15.0**, [two additional quantization types](/documentation/guides/quantization/#15-bit-and-2-bit-quantization) were introduced: **1.5-bit** and **2-bit binary quantization**.  
> These methods provide a useful middle ground: they are more aggressive than scalar quantization but offer better precision than standard binary quantization. They also address one of binary quantization’s main weaknesses: **handling values close to zero**.  
>
> **<font color='red'>Additionally:</font>** [Asymmetric quantization](#asymmetric-quantization) was added. This method allows combining different quantization strategies for queries and documents, helping balance **accuracy** and **compression efficiency**.

```python
# Binary quantization setup  
client.create_collection(
    collection_name="binary_collection",
    vectors_config=models.VectorParams(
        size=1536,
        distance=models.Distance.COSINE,
        on_disk=True,
    ),
    quantization_config=models.BinaryQuantization(
        binary=models.BinaryQuantizationConfig(
            encoding=models.BinaryQuantizationEncoding.ONE_BIT,
            always_ram=True,
        )
    ),
)
```

> [Check out](/documentation/guides/quantization/#setting-up-binary-quantization) how to set up binary quantization in **TypeScript**, **Rust**, **Java**, **C#**, and **Go** clients.

## Product Quantization

[Product quantization](/articles/product-quantization/) employs a divide-and-conquer approach, segmenting vectors into sub-vectors and encoding each segment using learned codebooks. The algorithm splits a high-dimensional vector into equal-sized sub-vectors, then applies k-means clustering to each segment independently, creating separate codebooks of 256 centroids per segment.

The compression mechanism stores centroid indices rather than original values. A 1024-dimensional vector divided into 128 sub-vectors (8 dimensions each) requires only 128 bytes for storage (128 indices × 1 byte), achieving approximately 32x compression. In extreme configurations, product quantization can reach 64x compression ratios.

The tradeoff is computational complexity and accuracy degradation. Distance calculations become non-SIMD-friendly, often resulting in slower query performance than unquantized vectors. The segmented encoding introduces approximation errors that compound across sub-vectors, leading to more significant accuracy penalties compared to scalar or binary methods. Product quantization serves specialized use cases where extreme compression outweighs accuracy and speed considerations.

```python
# Product quantization setup
client.create_collection(
    collection_name="pq_collection",
    vectors_config=models.VectorParams(
        size=1024,
        distance=models.Distance.COSINE,
        on_disk=True,
    ),
    quantization_config=models.ProductQuantization(
        product=models.ProductQuantizationConfig(
            compression=models.CompressionRatio.X32, #or X4, X8, X16, X32 and X64
            always_ram=True,
        )
    ),
)
```

> [Check out](/documentation/guides/quantization/#setting-up-product-quantization) how to set up product quantization in **TypeScript**, **Rust**, **Java**, **C#**, and **Go** clients.

## Quantization Comparison

| Quantization Method | Accuracy | Speed    | Compression |
|---------------------|----------|----------|-------------|
| Scalar              | 0.99     | up to 2x | 4x          |
| Binary              | 0.95*    | up to 40x| 32x         |
| Product             | 0.7      | 0.5x     | up to 64x   |å
*For compatible models

> [Check out](/documentation/guides/quantization/#how-to-choose-the-right-quantization-method) how the new **1.5-bit** and **2-bit binary quantization** methods compare to classical binary quantization. They offer a balanced middle ground between **binary** and **scalar** approaches.


## Dual Storage Architecture

Qdrant's quantization implementation maintains both compressed and original vectors, enabling flexible deployment strategies and safe experimentation. This dual storage approach allows you to switch quantization methods, adjust parameters, or disable quantization entirely without data re-ingestion - a critical advantage for production systems where data pipeline complexity must be minimized.

> Check out our **[quantization tips](/documentation/guides/quantization/#quantization-tips)**

The default configuration stores both representations in RAM, providing fast search with quantized vectors and exact scoring with originals when needed. However, this negates memory savings. The optimal production pattern places original vectors on disk (`on_disk=True`) while keeping quantized vectors in RAM (`always_ram=True`). This configuration delivers the best of both worlds: rapid quantized search with the ability to perform exact rescoring by reading only the small candidate set from disk storage.

This storage strategy is particularly effective because quantized search reliably identifies the neighborhood of relevant documents, making the selective disk reads for rescoring both efficient and accurate. The result is dramatic RAM reduction with minimal latency impact, exactly what production RAG systems require for cost-effective scaling. 