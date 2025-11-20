---
title: "Multivectors for Late Interaction Models"
description: Learn how Qdrant supports late interaction models like ColBERT and ColPali using multivectors for token-level precision, enabling fine-grained, context-aware text and visual document retrieval.
weight: 2
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

Late-interaction models such as ColBERT retain per-token document vectors. At search time, they identify the best matches by comparing all the query tokens with all the document tokens. This token-level precision preserves local semantic matches and delivers superior relevance, especially for complex queries and documents.

## Late Interaction: Token-Level Precision

Qdrant implements this powerful technique through [multivector representations](/documentation/concepts/vectors/#multivectors). A multivector field holds an ordered list of subvectors, each of which captures a different token of the document.

At query time, Qdrant performs the late interaction scoring. It compares every query token embedding $ q_i $ with each document token embedding $ d_j $. Only the highest score per query token is retained and these top scores are then summed. This mechanism, called MaxSim, delivers fine-grained relevance that respects the structure of your content.

$$
MaxSim_{\text{norm}}(Q, D) = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \max_{j=1}^{|D|} \text{sim}(q_i, d_j)
$$

To enable this in Qdrant, you create a collection with a dense vector that has a multivector comparator provided.

## Generating Token-Level Embeddings

You can generate the required token-level embeddings with FastEmbed:

```python
from fastembed import LateInteractionTextEmbedding

encoder = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
doc_multivectors = list(encoder.embed(["A long document about AI in medicine."]))
# Returns [[token_vec1, token_vec2, ...]]
```

The model `colbert-ir/colbertv2.0` outputs 128-dimensional vectors and is available through FastEmbed's optimized ONNX runtime. Use `.embed` for documents and `.query_embed` for queries.

## Collection Configuration: Multivector Setup

To use ColBERT for retrieval, create a collection with a multivector field configured for late interaction scoring:

```python
from qdrant_client import QdrantClient, models
import os

client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))

# For Colab:
# from google.colab import userdata
# client = QdrantClient(url=userdata.get("QDRANT_URL"), api_key=userdata.get("QDRANT_API_KEY"))

client.create_collection(
    collection_name="my_colbert_collection",
    vectors_config={
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            # Disable HNSW to save RAM - it won't typically be used with multivectors
            hnsw_config=models.HnswConfigDiff(m=0),
        )
    }
)
```

By specifying `MAX_SIM`, you tell Qdrant to apply the late interaction scoring at query time. We explicitly disable HNSW indexing with `m=0` because the graph typically won't be used for multivectors (except in rare edge cases), so disabling it saves RAM. Without HNSW, queries use brute-force MaxSim scoring across all points, which provides maximum precision but may be slower on large collections. For better performance on larger datasets, you'll learn about retrieval-reranking patterns in the next lesson.

## Querying with ColBERT

To search using your ColBERT multivector field, embed your query and pass it directly to `query_points`:

```python
from fastembed import LateInteractionTextEmbedding

# Encode the query
colbert = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
colbert_query = next(colbert.query_embed(["what is the policy?"])).tolist()

# Search using ColBERT multivector
hits = client.query_points(
    collection_name="my_colbert_collection",
    query=colbert_query,
    using="colbert",
    limit=20,
)
```

Qdrant performs brute-force MaxSim scoring between your query tokens and the document tokens for all points in the collection. This delivers highly precise results based on fine-grained token-level matching. Keep in mind that without HNSW indexing, this approach may be slower on large collections - in the next lesson you'll see how to combine fast approximate retrieval with ColBERT reranking for better performance.

## ColPali for Visual Documents

For documents with rich layouts, PDFs, invoices, slide decks, ColPali (Contextualized Late Interaction over PaliGemma) extends the same idea to vision. ColPali divides each page into a 32×32 grid (1,024 patches), encodes each patch with a vision-language model into 128-dimensional vectors, and treats those patch embeddings as subvectors. You use the identical multivector configuration, and Qdrant applies MaxSim on token embeddings, no matter how they were created.

The visual approach eliminates traditional OCR and layout detection steps, processing document images directly to capture both textual content and visual structure in a single pass. This makes ColPali particularly effective for complex documents where layout and visual elements are crucial for understanding.

## Next
With multivectors in your toolkit, you can achieve high-precision retrieval for both text and visual documents. In the next lesson, we'll explore the Universal Query API, where you'll learn how to combine multiple retrieval strategies and use ColBERT for reranking - a more common production pattern that balances speed and precision when working with large collections. 