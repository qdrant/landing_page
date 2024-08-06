---
title: Working with ColBERT 
weight: 6
---

# How to Generate ColBERT Multivectors with FastEmbed

With FastEmbed, you can use ColBERT to generate multivector embeddings. ColBERT is a powerful retrieval model that combines the strength of BERT embeddings with efficient late interaction techniques. FastEmbed will provide you with an optimized pipeline to utilize these embeddings in your search tasks.

Please note that ColBERT requires more resources than other no-interaction models. We recommend you use ColBERT as a re-ranker instead of a first-stage retriever. 

The first-stage retriever can retrieve 100-500 examples. This task would be done by a simpler model. Then, you can rank the leftover results with ColBERT.

## Setup

This command imports all late interaction models for text embedding.

```python
from fastembed import LateInteractionTextEmbedding
```
You can list which models are supported in your version of FastEmbed.

```python
LateInteractionTextEmbedding.list_supported_models()
```
This command displays the available models. The output shows details about the ColBERT model, including its dimensions, description, size, sources, and model file.

```python
[{'model': 'colbert-ir/colbertv2.0',
  'dim': 128,
  'description': 'Late interaction model',
  'size_in_GB': 0.44,
  'sources': {'hf': 'colbert-ir/colbertv2.0'},
  'model_file': 'model.onnx'}]
```
Now, load the model.

```python
embedding_model = LateInteractionTextEmbedding("colbert-ir/colbertv2.0")
```
The model files will be fetched and downloaded, with progress showing.

## Embed data

First, you need to define both documents and queries.

```python
documents = [
    "ColBERT is a late interaction text embedding model, however, there are also other models such as TwinBERT.",
    "On the contrary to the late interaction models, the early interaction models contains interaction steps at embedding generation process",
]
queries = [
    "Are there any other late interaction text embedding models except ColBERT?",
    "What is the difference between late interaction and early interaction text embedding models?",
]
```

**Note:** ColBERT computes document and query embeddings differently. Make sure to use the corresponding methods.

Now, create embeddings from both documents and queries.

```python
document_embeddings = list(
    embedding_model.embed(documents)
)  # embed and qury_embed return generators,
# which we need to evaluate by writing them to a list
query_embeddings = list(embedding_model.query_embed(queries))

```
Display the shapes of document and query embeddings.

```python
document_embeddings[0].shape, query_embeddings[0].shape
```

You should get something like this:

```python
((26, 128), (32, 128))
```

Don't worry about query embeddings having the bigger shape in this case. ColBERT authors recommend to pad queries with [MASK] tokens to 32 tokens. They also recommend truncating queries to 32 tokens, however, we don't do that in FastEmbed so that you can put some straight into the queries.

## Compute similarity

This function calculates the relevance scores using the MaxSim operator, sorts the documents based on these scores, and returns the indices of the top-k documents.

```python
import numpy as np


def compute_relevance_scores(query_embedding: np.array, document_embeddings: np.array, k: int):
    """
    Compute relevance scores for top-k documents given a query.

    :param query_embedding: Numpy array representing the query embedding, shape: [num_query_terms, embedding_dim]
    :param document_embeddings: Numpy array representing embeddings for documents, shape: [num_documents, max_doc_length, embedding_dim]
    :param k: Number of top documents to return
    :return: Indices of the top-k documents based on their relevance scores
    """
    # Compute batch dot-product of query_embedding and document_embeddings
    # Resulting shape: [num_documents, num_query_terms, max_doc_length]
    scores = np.matmul(query_embedding, document_embeddings.transpose(0, 2, 1))

    # Apply max-pooling across document terms (axis=2) to find the max similarity per query term
    # Shape after max-pool: [num_documents, num_query_terms]
    max_scores_per_query_term = np.max(scores, axis=2)

    # Sum the scores across query terms to get the total score for each document
    # Shape after sum: [num_documents]
    total_scores = np.sum(max_scores_per_query_term, axis=1)

    # Sort the documents based on their total scores and get the indices of the top-k documents
    sorted_indices = np.argsort(total_scores)[::-1][:k]

    return sorted_indices
```
Calculate sorted indices.

```python
sorted_indices = compute_relevance_scores(
    np.array(query_embeddings[0]), np.array(document_embeddings), k=3
)
print("Sorted document indices:", sorted_indices)
```
The output shows the sorted document indices based on the relevance to the query.

```python
Sorted document indices: [0 1]
```

## Show results

```python
print(f"Query: {queries[0]}")
for index in sorted_indices:
    print(f"Document: {documents[index]}")
```

The query and corresponding sorted documents are displayed, showing the relevance of each document to the query.

```bash
Query: Are there any other late interaction text embedding models except ColBERT?
Document: ColBERT is a late interaction text embedding model, however, there are also other models such as TwinBERT.
Document: On the contrary to the late interaction models, the early interaction models contains interaction steps at embedding generation process
```
