---
title: Measure Retrieval Quality
weight: 21
---

# Measure Retrieval Quality

| Time: 30 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

In this tutorial, we will show you how to measure and improve the quality of retrieval using Qdrant. 

Semantic search pipelines are as good as the embeddings they use. If your model cannot properly represent input data, similar objects might be far away from each other in the vector space. No surprise, that the search results will be poor in this case. There is, however, another component of the process which can also degrade the quality of the search results. It is the ANN algorithm itself.

In this tutorial, we will show how to measure the quality of the semantic retrieval and how to tune the parameters of the HNSW, the ANN algorithm used in Qdrant, to obtain the best results.

## Embeddings quality
Embeddings quality is typically measured using benchmarks like the Massive Text Embedding Benchmark (MTEB). The evaluation process compares search results with a human-curated ground truth dataset. This involves taking a query, finding the most similar documents in the vector space using full kNN search, and comparing them with the expected results.

## Retrieval quality
While embeddings quality is crucial for semantic search, vector search engines like Qdrant use Approximate Nearest Neighbors (ANN) algorithms. These are faster than exact search but may return suboptimal results. The quality of this approximation also contributes to overall search performance.

## Quality metrics
Various metrics quantify semantic search quality. Precision@k measures relevant documents in top-k results, while Mean Reciprocal Rank (MRR) considers the position of the first relevant document. DCG and NDCG are based on document relevance scores.

For ANN algorithms, precision@k is most applicable. It's calculated as the number of relevant documents in top-k results divided by k. Using exact kNN search as ground truth, we can measure how well the ANN algorithm approximates exact search.

To evaluate ANN quality in Qdrant:
1. Perform an approximate search
2. Perform an exact search
3. Compare results using precision

Let's demonstrate this process using the "Qdrant/arxiv-titles-instructorxl-embeddings" dataset from Hugging Face hub. We'll create a collection, populate it with data, evaluate the search quality, and then tune parameters to improve the results. This will involve adjusting HNSW parameters such as `ef_construct`, `m`, and `ef_search` to find the optimal balance between search speed and accuracy.

## Step 0: Install Required Packages

Before we begin, let's install the necessary packages:

```bash
pip install qdrant-client datasets
```

## Step 1: Load the Dataset

We’ll use a pre-embedded dataset from Hugging Face to train and test Qdrant’s search capabilities. First, load and split the dataset for training (50,000 items) and testing (5,000 items). 

```python
from datasets import load_dataset

# Load dataset
dataset = load_dataset("Qdrant/arxiv-titles-instructorxl-embeddings", split="train", streaming=True)

# Split data
dataset_iterator = iter(dataset)
train_dataset = [next(dataset_iterator) for _ in range(50000)]
test_dataset = [next(dataset_iterator) for _ in range(5000)]
```

## Step 2: Create a Collection in Qdrant

Create a collection in Qdrant using cosine distance for similarity. This will store the embedding vectors.

```python
from qdrant_client import QdrantClient, models

# Initialize Qdrant client and create collection
client = QdrantClient("http://localhost:6333")
client.create_collection(
    collection_name="arxiv-titles-instructorxl-embeddings",
    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
)
```

## Step 3: Index the Training Data

Upload the training data to the collection and let Qdrant build the HNSW graph for approximate nearest neighbor searches.

```python
# Upload training data to Qdrant
client.upload_points(
    collection_name="arxiv-titles-instructorxl-embeddings",
    points=[
        models.PointStruct(id=item["id"], vector=item["vector"], payload=item)
        for item in train_dataset
    ]
)

# Wait for the indexing process to finish
while True:
    collection_info = client.get_collection("arxiv-titles-instructorxl-embeddings")
    if collection_info.status == models.CollectionStatus.GREEN:
        break
```

## Step 4: Measure Retrieval Quality (Precision@k)

Compare approximate ANN search with exact kNN search to evaluate retrieval quality.

```python
def avg_precision_at_k(k: int):
    precisions = []
    for item in test_dataset:
        # ANN search
        ann_result = client.query_points(
            collection_name="arxiv-titles-instructorxl-embeddings",
            query=item["vector"],
            limit=k
        ).points
        
        # Exact search
        knn_result = client.query_points(
            collection_name="arxiv-titles-instructorxl-embeddings",
            query=item["vector"],
            limit=k,
            search_params=models.SearchParams(exact=True)
        ).points

        # Calculate precision@k
        ann_ids = set(item.id for item in ann_result)
        knn_ids = set(item.id for item in knn_result)
        precision = len(ann_ids.intersection(knn_ids)) / k
        precisions.append(precision)
    
    return sum(precisions) / len(precisions)

# Calculate precision@5
print(f"avg(precision@5) = {avg_precision_at_k(k=5)}")
```

Output:

```text
avg(precision@5) = 0.9935999999999995
```
## Step 5: Tune HNSW Parameters for Better Precision

The HNSW (Hierarchical Navigable Small World) algorithm used by Qdrant has two main parameters that affect its performance and accuracy:

1. `m`: This parameter determines the maximum number of edges per node in the graph. A higher value of `m` increases the connectivity of the graph, potentially improving search accuracy at the cost of increased memory usage and indexing time.

2. `ef_construct`: This parameter controls the size of the dynamic candidate list during index construction. A higher value of `ef_construct` results in a more exhaustive search during indexing, which can lead to a higher quality graph at the expense of longer indexing times.

Let's adjust these parameters to improve the precision of the ANN search:

```python
# Tune HNSW parameters for higher precision
client.update_collection(
    collection_name="arxiv-titles-instructorxl-embeddings",
    hnsw_config=models.HnswConfigDiff(
        m=32,  # Increase edges per node from the default (usually 16)
        ef_construct=200  # Increase neighbors considered during indexing (default is usually 100)
    )
)

# Wait for re-indexing
while True:
    collection_info = client.get_collection("arxiv-titles-instructorxl-embeddings")
    if collection_info.status == models.CollectionStatus.GREEN:
        break

# Recalculate precision@5
print(f"avg(precision@5) = {avg_precision_at_k(k=5)}")
```
Response:

```text
avg(precision@5) = 0.9969999999999998
```

You can see that the precision@5 has increased from 0.9936 to 0.9969, a 0.0034 gain! 

By increasing `m` from its default value (usually 16) to 32, we're allowing more connections between nodes in the HNSW graph. This can help improve the search accuracy by providing more paths to explore during the search process.

Increasing `ef_construct` from its default (usually 100) to 200 means that during the index construction, the algorithm will consider more potential neighbors for each point. This can result in a higher quality graph structure, potentially leading to more accurate search results.

It's important to note that these improvements in accuracy come at the cost of increased memory usage and longer indexing times. The optimal values for these parameters can vary depending on your specific dataset and use case, so it's often beneficial to experiment with different values to find the best trade-off between accuracy and performance for your application.

---
