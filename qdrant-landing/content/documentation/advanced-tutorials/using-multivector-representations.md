---
title: How to Use Multivector Representations with Qdrant Effectively
weight: 2
aliases:
  - /documentation/search-precision/multivector-representations-with-Qdrant/
---
# How to Effectively Use Multivector Representations in Qdrant for Reranking
Multivector Representations are one of the most powerful features of Qdrant. However, most people don't use them effectively, resulting in massive RAM overhead, slow inserts, and wasted compute. 

In this tutorial, you'll discover how to effectively use multivector representations in Qrant. 

## What are Multivector Representations?
In most vector engines, each document is represented by a single vector - an approach that works well for short texts but often struggles with longer documents. To mitigate this, it's common practice to split documents into smaller chunks (e.g., paragraphs or sentences) and embed each chunk individually. While this chunking strategy improves retrieval granularity, it can miss broader context across chunks.

Multivector representations offer a more fine-grained alternative: instead of chunking, a single document is represented using multiple vectors, often at the token or phrase level. This enables more precise matching between specific query terms and relevant parts of the document. Matching is especially effective in Late Interaction models like [ColBERT](https://qdrant.tech/documentation/fastembed/fastembed-colbert/), which retain token-level embeddings and perform interaction during query time leading to relevance scoring.

As you will see later in the tutorial, Qdrant supports multivectors and late interaction models natively. 

## Why Token-level Vectors are Useful

With token-level vectors, models like ColBERT can match specific query tokens to the most relevant parts of a document, enabling high-accuracy retrieval through Late Interaction.

Each document is converted into multiple token-level vectors instead of a single vector in Late Interaction. The query is also tokenized and embedded into various vectors. Then, the query and document vectors are matched using a similarity function. In traditional retrieval, the query and document are converted into single embeddings, after which similarity is computed. This is an early interaction because the information is compressed before retrieval. 

## What is Rescoring, and Why is it Used?
Rescoring is two-fold:
- Retrieve relevant documents using a fast dense model. 
- Rerank them using a more accurate but slower model such as ColBERT.

## Why Indexing Every Vector by Default is a Problem
In multivector representations (such as those used by Late Interaction models like ColBERT), a single  document - say, a PDF or full article - can result in hundreds of token-level vectors. Indexing each of these vectors individually with HNSW in Qdrant can lead to:

- High RAM usage
- Slow insert times due to the complexity of maintaining the HNSW graph

However, because multivector search is typically used in the reranking stage (after a first-pass retrieval using dense vectors), there's often no need to index these token-level vectors with HNSW.

Instead, they can be stored as multi-vector fields (without HNSW indexing) and used at query-time for reranking, which reduces resource overhead and improves performance.

For more on this, check out Qdrant's detailed breakdown in our [Scaling PDF Retrieval with Qdrant tutorial](https://qdrant.tech/documentation/advanced-tutorials/pdf-retrieval-at-scale/#math-behind-the-scaling). 

With Qdrant, you have full control of how indexing works. You can disable indexing by setting the HNSW `m` parameter to `0`:
```python
hnsw_config=models.HnswConfigDiff(m=0)
```
By disabling HNSW on multivectors, you:
- Save compute. 
- Reduce memory usage.
- Speed up vector uploads. 
- Focus the resources on reranking, where they are needed most. 

## How to Generate Multivectors Using FastEmbed
Let's demonstrate how to effectively use multivectors using [FastEmbed](https://github.com/qdrant/fastembed), which wraps ColBERT into a simple API. 

Install FastEmbed and Qdrant:

```bash
pip install fastembed qdrant-client
```

## Step-by-Step: ColBERT + Qdrant Setup
Ensure that Qdrant is running and create a client:
```python
from qdrant_client import QdrantClient, models
# 1. Connect to Qdrant server
client = QdrantClient(host="localhost", port=6333)
```
### 1. Load Dense and ColBERT Models
First load the dense and ColBERT models:
```python
from fastembed import TextEmbedding, LateInteractionTextEmbedding

dense_model = TextEmbedding("BAAI/bge-small-en")
colbert_model = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
```

## 2. Encode Documents
Next, encode the documents: 
```python
# Example documents and query
documents = [
    "Artificial intelligence is used in hospitals for cancer diagnosis and treatment.",
    "Self-driving cars use AI to detect obstacles and make driving decisions.",
    "AI is transforming customer service through chatbots and automation."
]
query_text = "How does AI help in medicine?"

# Generate embeddings
dense_doc_vectors = list(dense_model.embed(documents))
dense_query_vector = list(dense_model.embed([query_text]))[0]

colbert_doc_vectors = list(colbert_model.embed(documents))
colbert_query_vector = list(colbert_model.embed([query_text]))[0]

```

### 3. Create a Qdrant collection
Then create a Qdrant collection with both vector types. Note that we leave indexing on for the `dense` vector but turn it off for the  `colbert` vector that will be used for reranking.
```python
collection_name = "dense_multivector_demo"
client.create_collection(
    collection_name=collection_name,
    vectors_config={
        "dense": models.VectorParams(
            size=384,
            distance=models.Distance.COSINE
            # Leave HNSW indexing ON for dense
        ),
        "colbert": models.VectorParams(
            size=128,
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM
            ),
            hnsw_config=models.HnswConfigDiff(m=0)  # Disable HNSW for reranking
        )
    }
)

```

### 4. Upload Documents (Dense + Multivector)
Now upload the vectors: 
```python
points = [
    models.PointStruct(
        id=i,
        vector={
            "dense": dense_vectors[i],
            "colbert": colbert_vectors[i]
        },
        payload={"text": documents[i]}
    ) for i in range(len(documents))
]
client.upsert(collection_name="dense_multivector_demo", points=points)

```

### Query with Retrieval + Reranking in One Call
Now let’s run a search:

```python
results = client.query_points(
    collection_name="dense_multivector_demo",
    prefetch=models.Prefetch(
        query=dense_query_vector,
        using="dense",
        limit=100
    ),
    query=colbert_query_vector,
    using="colbert",
    limit=10,
    with_payload=True
)

```

- The dense vector retrieves the top 100 candidates quickly.
- The Colbert multivector reranks them using token-level `MaxSim` with fine-grained precision.
- Returns the top 10 results. 

## Conclusion
Multivector search is one of the most powerful features of a vector database when used correctly. With this functionality in Qdrant, you can: 
- Store token-level embeddings natively. 
- Disable indexing to reduce overhead. 
- Run fast and accurate search in one API call. 
- Efficiently scale late interaction.

Combining FastEmbed and Qdrant leads to a production-ready pipeline for ColBERT-style reranking without wasting resources. You can do this locally or use Qdrant Cloud. Qdrant offers an easy-to-use API to get started with your search engine, so if you’re ready to dive in, sign up for free at [Qdrant Cloud](https://qdrant.tech/cloud/) and start building.


