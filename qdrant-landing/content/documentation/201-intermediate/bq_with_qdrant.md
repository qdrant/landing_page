---
notebook_path: 201-intermediate/binary-quantization-qdrant/bq_with_qdrant.ipynb
reading_time_min: 10
title: Binary Quantization with Qdrant
---

# Binary Quantization with Qdrant

This notebook demonstrates/evaluates the search performance of Qdrant with Binary Quantization. We will use [Qdrant Cloud](https://qdrant.to/cloud?utm_source=qdrant&utm_medium=social&utm_campaign=binary-openai-v3&utm_content=article) to index and search the embeddings. This demo can be carried out on a free-tier Qdrant cluster as well.

# Set Up Binary Quantization

Let's install the 2 Python packages we'll work with.

```python
%pip install qdrant-client datasets
```

For the demo, We use samples from the [Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K](https://huggingface.co/datasets/Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K) dataset. The dataset includes embeddings generated using OpenAI's `text-embedding-3-small` model.

You can use your own datasets for this evaluation by adjusting the config values below.

We select 100 records at random from the dataset. We then use the embeddings of the queries to search for the nearest neighbors in the dataset.

## Configure Credentials

```python
# QDRANT CONFIG
URL = "https://xyz-example.eu-central.aws.cloud.qdrant.io:6333"
API_KEY = "<provide-your-own-key>"
COLLECTION_NAME = "bq-evaluation"

# EMBEDDING CONFIG
DATASET_NAME = "Qdrant/dbpedia-entities-openai3-text-embedding-3-small-1536-100K"
DIMENSIONS = 1536
EMBEDDING_COLUMN_NAME = "text-embedding-3-small-1536-embedding"

## UPLOAD CONFIG
BATCH_SIZE = 1024  # Batch size for uploading points
PARALLEL = 1  # Number of parallel processes for uploading points
```

## Setup A Qdrant Collection

Let's create a Qdrant collection to index our vectors. We set `on_disk` in the vectors config to `True` offload the original vectors to disk to save memory.

```python
from datasets import load_dataset
from qdrant_client import QdrantClient, models
import logging

from tqdm import tqdm

logging.basicConfig(level=logging.INFO)

client = QdrantClient(url=URL, api_key=API_KEY)

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=models.VectorParams(
            size=DIMENSIONS, distance=models.Distance.COSINE, on_disk=True
        ),
        quantization_config=models.BinaryQuantization(
            binary=models.BinaryQuantizationConfig(always_ram=False),
        ),
    )
    logging.info(f"Created collection {COLLECTION_NAME}")
else:
    collection_info = client.get_collection(collection_name=COLLECTION_NAME)
    logging.info(
        f"Collection {COLLECTION_NAME} already exists with {collection_info.points_count} points."
    )

logging.info("Loading Dataset")
dataset = load_dataset(
    DATASET_NAME,
    split="train",
)
logging.info(f"Loaded {DATASET_NAME} dataset")

logging.info("Loading Points")
points = [
    models.PointStruct(id=i, vector=embedding)
    for i, embedding in enumerate(dataset[EMBEDDING_COLUMN_NAME])
]
logging.info(f"Loaded {len(points)} points")

logging.info("Uploading Points")
client.upload_points(COLLECTION_NAME, points=tqdm(points), batch_size=BATCH_SIZE)
logging.info(f"Collection {COLLECTION_NAME} is ready")
```

## Evaluate Results

### Parameters: Oversampling, Rescoring, and Search Limits

For each record, we run a parameter sweep over the number of oversampling, rescoring, and search limits. We can then understand the impact of these parameters on search accuracy and efficiency. Our experiment was designed to assess the impact of Binary Quantization under various conditions, based on the following parameters:

- **Oversampling**: By oversampling, we can limit the loss of information inherent in quantization. We experimented with different oversampling factors, and identified the impact on the accuracy and efficiency of search. Spoiler: higher oversampling factors tend to improve the accuracy of searches. However, they usually require more computational resources.

- **Rescoring**: Rescoring refines the first results of an initial binary search. This process leverages the original high-dimensional vectors to refine the search results, **always** improving accuracy. We toggled rescoring on and off to measure effectiveness, when combined with Binary Quantization. We also measured the impact on search performance.

- **Search Limits**: We specify the number of results from the search process. We experimented with various search limits to measure their impact the accuracy and efficiency. We explored the trade-offs between search depth and performance. The results provide insight for applications with different precision and speed requirements.

# Parameterized Search

We will compare the exact search performance with the approximate search performance.

```python
def parameterized_search(
    point,
    oversampling: float,
    rescore: bool,
    exact: bool,
    collection_name: str,
    ignore: bool = False,
    limit: int = 10,
):
    if exact:
        return client.query_points(
            collection_name=collection_name,
            query=point.vector,
            search_params=models.SearchParams(exact=exact),
            limit=limit,
        ).points
    else:
        return client.query_points(
            collection_name=collection_name,
            query=point.vector,
            search_params=models.SearchParams(
                quantization=models.QuantizationSearchParams(
                    ignore=ignore,
                    rescore=rescore,
                    oversampling=oversampling,
                ),
                exact=exact,
            ),
            limit=limit,
        ).points
```

<hr />

```python
import json
import random
import numpy as np

oversampling_range = np.arange(1.0, 3.1, 1.0)
rescore_range = [True, False]

ds = dataset.train_test_split(test_size=0.001, shuffle=True, seed=37)["test"]
ds = ds.to_pandas().to_dict(orient="records")

results = []
with open(f"{COLLECTION_NAME}.json", "w+") as f:
    for element in tqdm(ds):
        point = models.PointStruct(
            id=random.randint(0, 100000),
            vector=element[EMBEDDING_COLUMN_NAME],
        )
        ## Running Grid Search
        for oversampling in oversampling_range:
            for rescore in rescore_range:
                limit_range = [100, 50, 20, 10, 5]
                for limit in limit_range:
                    try:
                        exact = parameterized_search(
                            point=point,
                            oversampling=oversampling,
                            rescore=rescore,
                            exact=True,
                            collection_name=COLLECTION_NAME,
                            limit=limit,
                        )
                        hnsw = parameterized_search(
                            point=point,
                            oversampling=oversampling,
                            rescore=rescore,
                            exact=False,
                            collection_name=COLLECTION_NAME,
                            limit=limit,
                        )
                    except Exception as e:
                        print(f"Skipping point: {point}\n{e}")
                        continue

                    exact_ids = [item.id for item in exact]
                    hnsw_ids = [item.id for item in hnsw]

                    accuracy = len(set(exact_ids) & set(hnsw_ids)) / len(exact_ids)

                    result = {
                        "query_id": point.id,
                        "oversampling": oversampling,
                        "rescore": rescore,
                        "limit": limit,
                        "accuracy": accuracy,
                    }
                    f.write(json.dumps(result))
                    f.write("\n")
```

## View The Results

We can now tabulate our results across the ranges of oversampling and rescoring.

```python
import pandas as pd

results = pd.read_json(f"{COLLECTION_NAME}.json", lines=True)

average_accuracy = results[results["limit"] != 1]
average_accuracy = average_accuracy[average_accuracy["limit"] != 5]
average_accuracy = average_accuracy.groupby(["oversampling", "rescore", "limit"])[
    "accuracy"
].mean()
average_accuracy = average_accuracy.reset_index()

acc = average_accuracy.pivot(
    index="limit", columns=["oversampling", "rescore"], values="accuracy"
)
```

<hr />

```python
from IPython.display import display, HTML

display(HTML(acc.to_html()))
```

<table border="1" class="dataframe">
  <thead>
    <tr>
      <th>oversampling</th>
      <th colspan="2" halign="left">1</th>
      <th colspan="2" halign="left">2</th>
      <th colspan="2" halign="left">3</th>
    </tr>
    <tr>
      <th>rescore</th>
      <th>False</th>
      <th>True</th>
      <th>False</th>
      <th>True</th>
      <th>False</th>
      <th>True</th>
    </tr>
    <tr>
      <th>limit</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>10</th>
      <td>0.6950</td>
      <td>0.9430</td>
      <td>0.6950</td>
      <td>0.9860</td>
      <td>0.6950</td>
      <td>0.9930</td>
    </tr>
    <tr>
      <th>20</th>
      <td>0.7050</td>
      <td>0.9520</td>
      <td>0.7050</td>
      <td>0.9860</td>
      <td>0.7050</td>
      <td>0.9915</td>
    </tr>
    <tr>
      <th>50</th>
      <td>0.6962</td>
      <td>0.9546</td>
      <td>0.6962</td>
      <td>0.9838</td>
      <td>0.6968</td>
      <td>0.9926</td>
    </tr>
    <tr>
      <th>100</th>
      <td>0.6991</td>
      <td>0.9561</td>
      <td>0.7003</td>
      <td>0.9904</td>
      <td>0.7007</td>
      <td>0.9964</td>
    </tr>
  </tbody>
</table>

## Results

Here are some key observations, which analyzes the impact of rescoring (`True` or `False`):

1. **Significantly Improved Accuracy**:

   - Enabling rescoring (`True`) consistently results in higher accuracy scores compared to when rescoring is disabled (`False`).
   - The improvement in accuracy is true across various search limits (10, 20, 50, 100).

1. **Model and Dimension Specific Observations**:

   - Th results suggest a diminishing return on accuracy improvement with higher oversampling in lower dimension spaces.

1. **Influence of Search Limit**:

   - The performance gain from rescoring seems to be relatively stable across different search limits, suggesting that rescoring consistently enhances accuracy regardless of the number of top results considered.

In summary, enabling rescoring dramatically improves search accuracy across all tested configurations. It is crucial feature for applications where precision is paramount. The consistent performance boost provided by rescoring underscores its value in refining search results, particularly when working with complex, high-dimensional data. This enhancement is critical for applications that demand high accuracy, such as semantic search, content discovery, and recommendation systems, where the quality of search results directly impacts user experience and satisfaction.

## Leveraging Binary Quantization: Best Practices

We recommend the following best practices for leveraging Binary Quantization:

1. Oversampling: Use an oversampling factor of 3 for the best balance between accuracy and efficiency. This factor is suitable for a wide range of applications.
1. Rescoring: Enable rescoring to improve the accuracy of search results.
1. RAM: Store the full vectors and payload on disk. Limit what you load from memory to the binary quantization index. This helps reduce the memory footprint and improve the overall efficiency of the system. The incremental latency from the disk read is negligible compared to the latency savings from the binary scoring in Qdrant, which uses SIMD instructions where possible.
