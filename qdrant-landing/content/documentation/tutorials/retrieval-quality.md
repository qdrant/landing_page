---
title: Measure retrieval quality
weight: 21
---

# Measure retrieval quality

| Time: 30 min | Level: Intermediate |  |    |
|--------------|---------------------|--|----|

Semantic search pipelines are as good as the embeddings they use. If your model cannot properly represent input data, similar objects might
be far away from each other in the vector space. No surprise, that the search results will be poor in this case. There is, however, another
component of the process which can also degrade the quality of the search results. It is the ANN algorithm itself. 

In this tutorial, we will show how to measure the quality of the semantic retrieval and how to tune the parameters of the HNSW, the ANN 
algorithm used in Qdrant, to obtain the best results.

## Embeddings quality

The quality of the embeddings is a topic for a separate tutorial. In a nutshell, it is usually measured and compared by benchmarks, such as 
[Massive Text Embedding Benchmark (MTEB)](https://huggingface.co/spaces/mteb/leaderboard). The evaluation process itself is pretty 
straightforward and is based on a ground truth dataset built by humans. We have a set of queries and a set of the documents we would expect
to receive for each of them. In the evaluation process, we take a query, find the most similar documents in the vector space and compare 
them with the ground truth. In that setup, **finding the most similar documents is implemented as full kNN search, without any approximation**.
As a result, we can measure the quality of the embeddings themselves, without the influence of the ANN algorithm.

## Retrieval quality

Embeddings quality is indeed the most important factor in the semantic search quality. However, vector search engines, such as Qdrant, do not 
perform pure kNN search. Instead, they use **Approximate Nearest Neighbors** (ANN) algorithms, which are much faster than the exact search, 
but can return suboptimal results. We can also **measure the retrieval quality of that approximation** which also contributes to the overall
search quality.

### Quality metrics

There are various ways of how quantify the quality of semantic search. Some of them, such as [Precision@k](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Precision_at_k), 
are based on the number of relevant documents in the top-k search results. Others, such as [Mean Reciprocal Rank (MRR)](https://en.wikipedia.org/wiki/Mean_reciprocal_rank), 
take into account the position of the first relevant document in the search results. [DCG and NDCG](https://en.wikipedia.org/wiki/Discounted_cumulative_gain) 
metrics are, in turn, based on the relevance score of the documents.

If we treat the search pipeline as a whole, we could use them all. The same is true for the embeddings quality evaluation. However, for the 
ANN algorithm itself, anything based on the relevance score or ranking is not applicable. Ranking in vector search relies on the distance
between the query and the document in the vector space, however distance is not going to change due to approximation, as the function is
still the same. 

Therefore, it only makes sense to measure the quality of the ANN algorithm by the number of relevant documents in the top-k search results, 
such as `precision@k`. It is calculated as the number of relevant documents in the top-k search results divided by `k`. In case of testing
just the ANN algorithm, we can use the exact kNN search as a ground truth, with `k` being fixed. It will be a measure on **how well the ANN
algorithm approximates the exact search**.

## Measure the quality of the search results

Let's build a quality evaluation of the ANN algorithm in Qdrant. We will, first, call the search endpoint in a standard way to obtain
the approximate search results. Then, we will call the exact search endpoint to obtain the exact matches, and finally compare both results
in terms of precision.

Before we start, let's create a collection, fill it with some data and then start our evaluation. We will use the same dataset as in the
[Loading a dataset from Hugging Face hub](/documentation/tutorials/huggingface-datasets/) tutorial, `Qdrant/arxiv-titles-instructorxl-embeddings`
from the [Hugging Face hub](https://huggingface.co/datasets/Qdrant/arxiv-titles-instructorxl-embeddings). Let's download it in a streaming
mode, as we are only going to use part of it.

```python
from datasets import load_dataset

dataset = load_dataset(
    "Qdrant/arxiv-titles-instructorxl-embeddings", split="train", streaming=True
)
```

We need some data to be indexed and another set for the testing purposes. Let's get the first 50000 items for the training and the next 1000
for the testing.

```python
dataset_iterator = iter(dataset)
train_dataset = [next(dataset_iterator) for _ in range(60000)]
test_dataset = [next(dataset_iterator) for _ in range(1000)]
```

Now, let's create a collection and index the training data. This collection will be created with the default configuration. Please be aware that
it might be different from your collection settings, and it's always important to test exactly the same configuration you are going to use later
in production.

<aside role="status">
    Distance function is another parameter that may impact the retrieval quality. If the embedding model was not trained to minimize cosine 
    distance, you can get suboptimal search results by using it. Please test different distance functions to find the best one for your embeddings, 
    if you don't know the specifics of the model training.
</aside>

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("http://localhost:6333")
client.create_collection(
    collection_name="arxiv-titles-instructorxl-embeddings",
    vectors_config=models.VectorParams(
        size=768,  # Size of the embeddings generated by InstructorXL model
        distance=models.Distance.COSINE,
    ),
)
```

We are now ready to index the training data. Uploading the records is going to trigger the indexing process, which will build the HNSW graph. 
The indexing process may take some time, depending on the size of the dataset, but your data is going to be available for search immediately
after receiving the response from the `upsert` endpoint. **As long as the indexing is not finished, and HNSW not built, Qdrant will perform 
the exact search**. We have to wait until the indexing is finished to be sure that the approximate search is performed.

```python
client.upload_records(
    collection_name="arxiv-titles-instructorxl-embeddings",
    records=[
        models.Record(
            id=item["id"],
            vector=item["vector"],
            payload=item,
        )
        for item in train_dataset
    ]
)

while True:
    collection_info = client.get_collection(collection_name="arxiv-titles-instructorxl-embeddings")
    if collection_info.status == models.CollectionStatus.GREEN:
        # Collection status is green, which means the indexing is finished
        break
```

## Standard mode vs exact search

Qdrant has a built-in exact search mode, which can be used to measure the quality of the search results. In this mode, Qdrant performs a
full kNN search for each query, without any approximation. It is not suitable for production use with high load, but it is perfect for the 
evaluation of the ANN algorithm and its parameters. It might be triggered by setting the `exact` parameter to `True` in the search request.
We are simply going to use all the examples from the test dataset as queries and compare the results of the approximate search with the
results of the exact search. Let's create a helper function with `k` being a parameter, so we can calculate the `precision@k` for different
values of `k`.

```python
def avg_precision_at_k(k: int):
    precisions = []
    for item in test_dataset:
        ann_result = client.search(
            collection_name="arxiv-titles-instructorxl-embeddings",
            query_vector=item["vector"],
            limit=k,
        )
    
        knn_result = client.search(
            collection_name="arxiv-titles-instructorxl-embeddings",
            query_vector=item["vector"],
            limit=k,
            search_params=models.SearchParams(
                exact=True,  # Turns on the exact search mode
            ),
        )

        # We can calculate the precision@k by comparing the ids of the search results
        ann_ids = set(item.id for item in ann_result)
        knn_ids = set(item.id for item in knn_result)
        precision = len(ann_ids.intersection(knn_ids)) / k
        precisions.append(precision)
    
    return sum(precisions) / len(precisions)
```

Calculating the `precision@5` is as simple as calling the function with the corresponding parameter:

```python
print(f"avg(precision@5) = {avg_precision_at_k(k=5)}")
```

Response:

```text
avg(precision@5) = 0.9935999999999995
```

As we can see, the precision of the approximate search vs exact search is pretty high. There are, however, some scenarios when we
need higher precision and can accept higher latency. HNSW is pretty tunable, and we can increase the precision by changing its parameters.
  
## Tweaking the HNSW parameters

HNSW is a hierarchical graph, where each node has a set of links to other nodes. The number of edges per node is called the `m` parameter. 
The larger the value of it, the higher the precision of the search, but more space required. The `ef_construct` parameter is the number of 
neighbours to consider during the index building. Again, the larger the value, the higher the precision, but the longer the indexing time.
The default values of these parameters are `m=16` and `ef_construct=100`. Let's try to increase them to `m=32` and `ef_construct=200` and
see how it affects the precision. Of course, we need to wait until the indexing is finished before we can perform the search.

```python
client.update_collection(
    collection_name="arxiv-titles-instructorxl-embeddings",
    hnsw_config=models.HnswConfigDiff(
        m=32,  # Increase the number of edges per node from the default 16 to 32
        ef_construct=200,  # Increase the number of neighbours from the default 100 to 200
    )
)

while True:
    collection_info = client.get_collection(collection_name="arxiv-titles-instructorxl-embeddings")
    if collection_info.status == models.CollectionStatus.GREEN:
        # Collection status is green, which means the indexing is finished
        break
```

The same function can be used to calculate the average `precision@5`:

```python
print(f"avg(precision@5) = {avg_precision_at_k(k=5)}")
```

Response:

```text
avg(precision@5) = 0.9969999999999998
```

The precision has obviously increased, and we know how to control it. However, there is a trade-off between the precision and the search
latency and memory requirements. In some specific cases, we may want to increase the precision as much as possible, so now we know how
to do it. 

## Wrapping up

Assessing the quality of retrieval is a critical aspect of evaluating semantic search performance. It is imperative to measure retrieval quality when aiming for optimal quality of.
your search results. Qdrant provides a built-in exact search mode, which can be used to measure the quality of the ANN algorithm itself, 
even in an automated way, as part of your CI/CD pipeline.

Again, **the quality of the embeddings is the most important factor**. HNSW does a pretty good job in terms of precision, and it is
parameterizable and tunable, when required. There are some other ANN algorithms available out there, such as [IVF*](https://github.com/facebookresearch/faiss/wiki/Faiss-indexes#cell-probe-methods-indexivf-indexes), 
but they usually [perform worse than HNSW in terms of quality and performance](https://nirantk.com/writing/pgvector-vs-qdrant/#correctness). 
