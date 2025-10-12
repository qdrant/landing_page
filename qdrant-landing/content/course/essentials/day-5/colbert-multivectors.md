---
title: Multivectors for Late Interaction Models
weight: 1
---

{{< date >}} Day 5 {{< /date >}}

# Multivectors for Late Interaction Models

{{< youtube "YOUR_YOUTUBE_VIDEO_ID_HERE" >}}

<br/>

Many embedding models represent data as a single vector. Transformer-based encoders achieve this by pooling the per-token vector matrix from the final layer into a single vector. That works great for most cases. But when your documents get more complex, cover multiple topics, or require context sensitivity, that one-size-fits-all compression starts to break down. You lose granularity and semantic alignment (though chunking and learned pooling mitigate this to an extent).

Late-interaction models such as ColBERT retain per-token document vectors. At search time, they identify the best matches by comparing all the query tokens with all the document tokens. While this preserves local matches, it increases the size of the index and the time taken to process queries, so many systems use single-vector retrieval for candidate selection and late interaction for re-ranking.

## Late Interaction: Token-Level Precision

Qdrant implements this powerful technique through [multivector representations](/documentation/concepts/vectors/#multivectors). A multivector field holds an ordered list of subvectors, where each subvector captures a different piece of the document. At query time, Qdrant performs the late interaction scoring. It takes every query token embedding and compares it to each document subvector. It keeps only the highest score per query token and then sums those top scores. This mechanism, called MaxSim, delivers fine-grained relevance that respects the structure of your content.

To enable this in Qdrant, you define two vector fields when creating your collection. One is a standard dense vector for fast candidate recall, and the other is your multivector field, which we'll name colbert to reflect the model we're using.

## Collection Configuration: Dense + Multivector

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)

client.create_collection(
    collection_name="my_colbert_collection",
    vectors_config={
        # 1. A dense vector for fast initial recall (HNSW indexed by default)
        "bge-dense": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
        ),
        
        # 2. A multivector for accurate, late-interaction reranking
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            # Disable HNSW for the multivector field to save RAM
            hnsw_config=models.HnswConfigDiff(m=0)
        )
    }
)
```

By specifying MAX_SIM, you tell Qdrant to apply the late interaction scoring at query time. Disabling HNSW indexing with m=0 means these subvectors are stored but not indexed - exactly what you want for reranking over a small candidate set, avoiding RAM bloat and slow inserts.

In practice, you pair this multivector field with a dense, HNSW-indexed field. In one API call, you first recall candidates with the dense field, then rerank those hits with your colbert multivector. Qdrant's prefetch and query parameters make this seamless.

## Generating Token-Level Embeddings

You can generate the required token-level embeddings with FastEmbed:

```python
from fastembed import LateInteractionTextEmbedding

encoder = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
doc_multivectors = list(encoder.embed(["A long document about AI in medicine."]))
# Returns [[token_vec1, token_vec2, ...]] - ready to upsert into the multivector field
```

FastEmbed returns a generator that yields nested lists, where each inner list contains all the token-level vectors for a single document, ready for upload to your Qdrant multivector field. The model "colbert-ir/colbertv2.0" produces 128-dimensional vectors and is available through FastEmbed's optimized ONNX runtime.

## ColPali for Visual Documents

For documents with rich layouts, PDFs, invoices, slide decks, ColPali (Contextualized Late Interaction over PaliGemma) extends the same idea to vision. ColPali divides each page into a 32×32 grid (1,024 patches), encodes each patch with a vision-language model into 128-dimensional vectors, and treats those patch embeddings as subvectors. You use the identical multivector configuration, and Qdrant applies MaxSim on layout regions at query time.

The visual approach eliminates traditional OCR and layout detection steps, processing document images directly to capture both textual content and visual structure in a single pass. This makes ColPali particularly effective for complex documents where layout and visual elements are crucial for understanding.

## Payload Design for Multi-vector Collections

Index payloads that help display and evaluation: `page_title`, `section_title`, `url`, `anchor`, `path/breadcrumbs`, `tags`, and a trimmed `text` field for snippets. Keep anchors so you can evaluate at section level.

With multivectors in your toolkit, you unlock high-precision retrieval for both text and structured documents. In the next video, we'll build on this foundation with the Universal Query API, showing how to combine dense, sparse, and multivector search, apply filters at each stage, and chain recall and rerank in a single request. 