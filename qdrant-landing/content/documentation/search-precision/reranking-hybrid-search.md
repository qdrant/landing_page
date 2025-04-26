---
title: Reranking in Hybrid Search
weight: 2
partition: build
---

# Reranking Hybrid Search Results with Qdrant Vector Database

Hybrid search combines dense and sparse retrieval to deliver precise and comprehensive results. By adding reranking with ColBERT, you can further refine search outputs for maximum relevance. 

In this guide, we’ll show you how to implement hybrid search with reranking in Qdrant, leveraging dense, sparse, and late interaction embeddings to create an efficient, high-accuracy search system. Let’s get started!

## Overview

Let’s start by breaking down the architecture:

![image3.png](/documentation/examples/reranking-hybrid-search/image3.png)

Processing Dense, Sparse, and Late Interaction Embeddings in Vector Databases (VDB)

### Ingestion Stage

Here’s how we’re going to set up the advanced hybrid search. The process is similar to what we did earlier but with a few powerful additions:

1. **Documents**: Just like before, we start with the raw input—our set of documents that need to be indexed for search.
2. **Dense Embeddings**: We’ll generate dense embeddings for each document, just like in the basic search. These embeddings capture the deeper, semantic meanings behind the text.
3. **Sparse Embeddings**: This is where it gets interesting. Alongside dense embeddings, we’ll create sparse embeddings using more traditional, keyword-based methods. Specifically, we’ll use BM25, a probabilistic retrieval model. BM25 ranks documents based on how relevant their terms are to a given query, taking into account how often terms appear, document length, and how common the term is across all documents. It’s perfect for keyword-heavy searches.
4. **Late Interaction Embeddings**: Now, we add the magic of ColBERT. ColBERT uses a two-stage approach. First, it generates contextualized embeddings for both queries and documents using BERT, and then it performs late interaction—matching those embeddings efficiently using a dot product to fine-tune relevance. This step allows for deeper, contextual understanding, making sure you get the most precise results.
5. **Vector Database**: All of these embeddings—dense, sparse, and late interaction—are stored in a vector database like Qdrant. This allows you to efficiently search, retrieve, and rerank your documents based on multiple layers of relevance.

![image2.png](/documentation/examples/reranking-hybrid-search/image2.png)

Query Retrieval and Reranking Process in Search Systems

### Retrieval Stage

Now, let's talk about how we’re going to pull the best results once the user submits a query:

1. **User’s Query**: The user enters a query, and that query is transformed into multiple types of embeddings. We’re talking about representations that capture both the deeper meaning (dense) and specific keywords (sparse).
2. **Embeddings**: The query gets converted into various embeddings—some for understanding the semantics (dense embeddings) and others for focusing on keyword matches (sparse embeddings).
3. **Hybrid Search**: Our hybrid search uses both dense and sparse embeddings to find the most relevant documents. The dense embeddings ensure we capture the overall meaning of the query, while sparse embeddings make sure we don’t miss out on those key, important terms.
4. **Rerank**: Once we’ve got a set of documents, the final step is reranking. This is where late interaction embeddings come into play, giving you results that are not only relevant but tuned to your query by prioritizing the documents that truly meet the user's intent.

## Implementation

Let’s see it in action in this section.

### Additional Setup

This time around, we’re using FastEmbed—a lightweight Python library designed for generating embeddings, and it supports popular text models right out of the box. First things first, you’ll need to install it:

```python
pip install fastembed
```

---

Here are the models we’ll be pulling from FastEmbed:

```python
from fastembed import TextEmbedding, LateInteractionTextEmbedding, SparseTextEmbedding 
```

---

### Ingestion

As before, we’ll convert our documents into embeddings, but thanks to FastEmbed, the process is even more straightforward because all the models you need are conveniently available in one location.

### Embeddings

First, let’s load the models we need:

```python
dense_embedding_model = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2")
bm25_embedding_model = SparseTextEmbedding("Qdrant/bm25")
late_interaction_embedding_model = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
```

---

Now, let’s convert our documents into embeddings:

```python
dense_embeddings = list(dense_embedding_model.embed(doc for doc in documents))
bm25_embeddings = list(bm25_embedding_model.embed(doc for doc in documents))
late_interaction_embeddings = list(late_interaction_embedding_model.embed(doc for doc in documents))
```

---

Since we’re dealing with multiple types of embeddings (dense, sparse, and late interaction), we’ll need to store them in a collection that supports a multi-vector setup. The previous collection we created won’t work here, so we’ll create a new one designed specifically for handling these different types of embeddings.

### Create Collection

Now, we’re setting up a new collection in Qdrant for our hybrid search with the right configurations to handle all the different vector types we’re working with.

Here’s how you do it:

```python
from qdrant_client.models import Distance, VectorParams, models

client.create_collection(
    "hybrid-search",
    vectors_config={
        "all-MiniLM-L6-v2": models.VectorParams(
            size=len(dense_embeddings[0]),
            distance=models.Distance.COSINE,
        ),
        "colbertv2.0": models.VectorParams(
            size=len(late_interaction_embeddings[0][0]),
            distance=models.Distance.COSINE,
            multivector_config=models.MultiVectorConfig(
                comparator=models.MultiVectorComparator.MAX_SIM,
            )
        ),
    },
    sparse_vectors_config={
        "bm25": models.SparseVectorParams(modifier=models.Modifier.IDF
        )
    }
)
```

---

What’s happening here? We’re creating a collection called "hybrid-search", and we’re configuring it to handle:

- **Dense embeddings** from the model all-MiniLM-L6-v2 using cosine distance for comparisons.
- **Late interaction embeddings** from colbertv2.0, also using cosine distance, but with a multivector configuration to use the maximum similarity comparator.
- **Sparse embeddings** from BM25 for keyword-based searches. They use dot_product for similarity calculation.

This setup ensures that all the different types of vectors are stored and compared correctly for your hybrid search.

### Upsert Data

Next, we need to insert the documents along with their multiple embeddings into the **hybrid-search** collection:

```python
from qdrant_client.models import PointStruct
points = []
for idx, (dense_embedding, bm25_embedding, late_interaction_embedding, doc) in enumerate(zip(dense_embeddings, bm25_embeddings, late_interaction_embeddings, documents)):
  
    point = PointStruct(
        id=idx,
        vector={
            "all-MiniLM-L6-v2": dense_embedding,
            "bm25": bm25_embedding.as_object(),
            "colbertv2.0": late_interaction_embedding,
        },
        payload={"document": doc}
    )
    points.append(point)

operation_info = client.upsert(
    collection_name="hybrid-search",
    points=points
)
```

<aside role="status">
Check how points can be uploaded with builtin Fastembed integration.
</aside>

<details>
    <summary>Upload with implicit embeddings computation</summary>


```python
from qdrant_client.models import PointStruct
points = []

for idx, doc in enumerate(documents):
    point = PointStruct(
        id=idx,
        vector={
            "all-MiniLM-L6-v2": models.Document(text=doc, model="sentence-transformers/all-MiniLM-L6-v2"),
            "bm25": models.Document(text=doc, model="Qdrant/bm25"),
            "colbertv2.0": models.Document(text=doc, model="colbert-ir/colbertv2.0"),
        },
        payload={"document": doc}
    )
    points.append(point)

operation_info = client.upsert(
    collection_name="hybrid-search",
    points=points
)
```
</details>

---

This code pulls everything together by creating a list of **PointStruct** objects, each containing the embeddings and corresponding documents.

For each document, it adds:

- **Dense embeddings** for the deep, semantic meaning.
- **BM25 embeddings** for powerful keyword-based search.
- **ColBERT embeddings** for precise contextual interactions.

Once that’s done, the points are uploaded into our **"hybrid-search"** collection using the upsert method, ensuring everything’s in place.

### Retrieval

For retrieval, it’s time to convert the user’s query into the required embeddings. Here’s how you can do it:

```python
dense_vectors = next(dense_embedding_model.query_embed(query))
sparse_vectors = next(bm25_embedding_model.query_embed(query))
late_vectors = next(late_interaction_embedding_model.query_embed(query))
```

---

The real magic of hybrid search lies in the **prefetch** parameter. This lets you run multiple sub-queries in one go, combining the power of dense and sparse embeddings. Here’s how to set it up, after which we execute the hybrid search:

```python
prefetch = [
        models.Prefetch(
            query=dense_vectors,
            using="all-MiniLM-L6-v2",
            limit=20,
        ),
        models.Prefetch(
            query=models.SparseVector(**sparse_vectors.as_object()),
            using="bm25",
            limit=20,
        ),
    ]
```

---

This code kicks off a hybrid search by running two sub-queries:

- One using dense embeddings from "all-MiniLM-L6-v2" to capture the semantic meaning of the query.
- The other using sparse embeddings from BM25 for strong keyword matching.

Each sub-query is limited to 20 results. These sub-queries are bundled together using the prefetch parameter, allowing them to run in parallel.

### Rerank

Now that we've got our initial hybrid search results, it’s time to rerank them using late interaction embeddings for maximum precision. Here’s how you can do it:

```python
results = client.query_points(
         "hybrid-search",
        prefetch=prefetch,
        query=late_vectors,
        using="colbertv2.0",
        with_payload=True,
        limit=10,
)
```

<aside role="status">
Check how queries can be made with builtin Fastembed integration.
</aside>

<details>
    <summary>Query points with implicit embeddings computation</summary>


```python
prefetch = [
        models.Prefetch(
            query=models.Document(text=query, model="sentence-transformers/all-MiniLM-L6-v2"),
            using="all-MiniLM-L6-v2",
            limit=20,
        ),
        models.Prefetch(
            query=models.Document(text=query, model="Qdrant/bm25"),
            using="bm25",
            limit=20,
        ),
    ]
results = client.query_points(
         "hybrid-search",
        prefetch=prefetch,
        query=models.Document(text=query, model="colbert-ir/colbertv2.0"),
        using="colbertv2.0",
        with_payload=True,
        limit=10,
)
```
</details>


---

Let’s look at how the positions change after applying reranking. Notice how some documents shift in rank based on their relevance according to the late interaction embeddings.

|  | **Document** | **First Query Rank** | **Second Query Rank** | **Rank Change** |
| --- | --- | --- | --- | --- |
|  | In machine learning, feature scaling is the process of normalizing the range of independent variables or features. The goal is to ensure that all features contribute equally to the model, especially in algorithms like SVM or k-nearest neighbors where distance calculations matter. | 1 | 1 | No Change |
|  | Feature scaling is commonly used in data preprocessing to ensure that features are on the same scale. This is particularly important for gradient descent-based algorithms where features with larger scales could disproportionately impact the cost function. | 2 | 6 | Moved Down |
|  | Unsupervised learning algorithms, such as clustering methods, may benefit from feature scaling, which ensures that features with larger numerical ranges don't dominate the learning process. | 3 | 4 | Moved Down |
|  | Data preprocessing steps, including feature scaling, can significantly impact the performance of machine learning models, making it a crucial part of the modeling pipeline. | 5 | 2 | Moved Up |

Great! We've now explored how reranking works and successfully implemented it.

## Best Practices in Reranking

Reranking can dramatically improve the relevance of search results, especially when combined with hybrid search. Here are some best practices to keep in mind:

- **Implement Hybrid Reranking**: Blend keyword-based (sparse) and vector-based (dense) search results for a more comprehensive ranking system.
- **Continuous Testing and Monitoring**: Regularly evaluate your reranking models to avoid overfitting and make timely adjustments to maintain performance.
- **Balance Relevance and Latency**: Reranking can be computationally expensive, so aim for a balance between relevance and speed. Therefore, the first step is to retrieve the relevant documents and then use reranking on it.

## Conclusion

Reranking is a powerful tool that boosts the relevance of search results, especially when combined with hybrid search methods. While it can add some latency due to its complexity, applying it to a smaller, pre-filtered subset of results ensures both speed and relevance.

Qdrant offers an easy-to-use API to get started with your own search engine, so if you’re ready to dive in, sign up for free at [Qdrant Cloud](https://qdrant.tech/) and start building
