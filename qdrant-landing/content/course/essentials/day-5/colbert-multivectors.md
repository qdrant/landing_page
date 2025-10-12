---
title: Multivectors for Late Interaction Models
weight: 1
---

{{< date >}} Day 5 {{< /date >}}

# Multivectors for Late Interaction Models

<div class="video">
<iframe 
  src="https://www.youtube.com/embed/8ptlXSsSEPk?si=TzsWlastazBQPWWb"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen>
</iframe>
</div>

<br/>

Many embedding models represent data as a single vector. Transformer-based encoders achieve this by pooling the per-token vector matrix from the final layer into a single vector. That works great for most cases. But when your documents get more complex, cover multiple topics, or require context sensitivity, that one-size-fits-all compression starts to break down. You lose granularity and semantic alignment (though chunking and learned pooling mitigate this to an extent).

Late-interaction models such as ColBERT retain per-token document vectors. At search time, they identify the best matches by comparing all the query tokens with all the document tokens. While this preserves local matches, it increases the size of the index and the time taken to process queries, so many systems use single-vector retrieval for candidate selection and late interaction for re-ranking.

## Late Interaction: Token-Level Precision

Qdrant implements this powerful technique through [multivector representations](/documentation/concepts/vectors/#multivectors). A multivector field holds an ordered list of subvectors, each of which captures a different token of the document.

At query time, Qdrant performs the late interaction scoring. It compares every query token embedding `(q_i)` with each document token embedding `(d_j)`. Only the highest score per query token is retained and these top scores are then summed. This mechanism, called MaxSim, delivers fine-grained relevance that respects the structure of your content.

$$
MaxSim_{\text{norm}}(Q, D) = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \max_{j=1}^{|D|} \text{sim}(q_i, d_j)
$$

To enable this in Qdrant, you create a collection with a dense vector that has a multivector comparator provided.

## Collection Configuration: Dense + Multivector

Typically, you define two vector fields when creating your collection with multivectors. One is a standard dense vector (e.g. `bge-dense`) for fast candidate retrieval, and the other is your multivector field (e.g. `colbert`) to re-score those candidates with token-level precision. Qdrant’s Query API does this in one request via `prefetch`.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient(
    url="https://your-cluster-url.cloud.qdrant.io",
    api_key="your-api-key",
)

client.create_collection(
    collection_name="my_colbert_collection",
    vectors_config={
        # 1. A dense vector for fast initial retrieval (HNSW indexed by default)
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

By specifying `MAX_SIM`, you tell Qdrant to apply the late interaction scoring at query time. Disabling HNSW indexing with `m=0` means these subvectors are stored but not indexed. This makes reranking slightly slower, but it avoids slow inserts - a good compromise for reranking over a small candidate set.

## One-call query: pull with dense, re-score with multivector

```python
from qdrant_client import models
from fastembed import LateInteractionTextEmbedding, TextEmbedding

# 1) Embed
dense = TextEmbedding("BAAI/bge-small-en-v1.5")
dense_q = next(dense.query_embed(["what is the policy?"])).tolist()

colbert = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
# FastEmbed returns a list of per-token vectors for the query
colbert_q = next(colbert.query_embed(["what is the policy?"])).tolist()

# 2) Query: prefetch candidates with dense, then re-score with multivector
hits = client.query_points(
    collection_name="my_colbert_collection",
    prefetch=[models.Prefetch(query=dense_q, using="bge-dense", limit=200)],
    query=colbert_q,
    using="colbert",
    limit=20,
)
```

`prefetch` runs the dense search. The main `query` applies MaxSim on the multivector field over the prefetched set.

## Generating Token-Level Embeddings

You can generate the required token-level embeddings with FastEmbed:

```python
from fastembed import LateInteractionTextEmbedding

encoder = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
doc_multivectors = list(encoder.embed(["A long document about AI in medicine."]))
# Returns [[token_vec1, token_vec2, ...]]
```

The model `colbert-ir/colbertv2.0` outputs 128-dimensional vectors and is available through FastEmbed's optimized ONNX runtime. Use `.embed` for documents and `.query_embed` for queries.

## ColPali for Visual Documents

For documents with rich layouts, PDFs, invoices, slide decks, ColPali (Contextualized Late Interaction over PaliGemma) extends the same idea to vision. ColPali divides each page into a 32×32 grid (1,024 patches), encodes each patch with a vision-language model into 128-dimensional vectors, and treats those patch embeddings as subvectors. You use the identical multivector configuration, and Qdrant applies MaxSim on layout regions at query time.

The visual approach eliminates traditional OCR and layout detection steps, processing document images directly to capture both textual content and visual structure in a single pass. This makes ColPali particularly effective for complex documents where layout and visual elements are crucial for understanding.

## Next
With multivectors in your toolkit, you get high-precision retrieval for both text and structured documents. In the next video, we'll build on this foundation with the Universal Query API, showing how to combine dense, sparse, and multivector search, apply filters at each stage, and chain retrieval and reranking in a single request. 