---
title: Cloud Quickstart
weight: 4
partition: cloud
aliases:
  - ../cloud-quick-start
  - cloud-quick-start
  - cloud-quickstart
  - cloud/quickstart-cloud/
  - /documentation/quickstart-cloud/
---

# Quick Start with Qdrant Cloud

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/3hrQP3hh69Y?si=hypr-vyKywhjoOTQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

Learn how to set up Qdrant Cloud, create a collection, insert vectors, and perform your first semantic search in just a few minutes.

## 1. Install the Qdrant Client

The fastest way to get started is to use the `qdrant-client` Python library which provides a convenient interface for working with Qdrant.

Install it using pip in your terminal or virtual environment:

```bash
pip install qdrant-client polars fastembed tqdm
```

## 2. Create a Cloud Cluster

1. Register for a [Cloud account](https://cloud.qdrant.io/signup) with your email, Google or Github credentials.
2. Go to **Clusters** and click **Create First Cluster**.
3. Copy your **API key** when prompted - you'll need it to connect. Store it somewhere safe as it won't be displayed again.

For detailed cluster setup instructions, see the [Cloud documentation](/documentation/cloud-intro/).

## 3. Connect to Qdrant Cloud

Import the `QdrantClient` and create a connection to your Qdrant Cloud cluster using your cluster URL and API key.

```python
from qdrant_client import QdrantClient

# Connect to Qdrant Cloud
client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io",
    api_key="your-api-key",
)
```

## 4. Create a Collection

Collections are the primary unit of data organization in Qdrant. Each collection stores vectors of the same dimensionality.

Specify the **vector size** (matching your embedding model) and the **distance metric** (Cosine, Euclidean, or Dot Product).

```python
from qdrant_client.models import Distance, VectorParams

# create a collection with 384-dimensional vectors
client.create_collection(
    collection_name="products",
    vectors_config=VectorParams(
        size=384,
        distance=Distance.COSINE
    )
)
```

## 5. Load and Insert Vectors

We'll use a real dataset from HuggingFace containing H&M e-commerce products with pre-computed embeddings.

```python
import polars as pl

from qdrant_client.models import PointStruct
from tqdm import tqdm

df = pl.read_parquet('hf://datasets/nleroy917/hm_ecommerce_products/hm_ecommerce_products_enriched.parquet')

dense_embeddings = df['dense_embedding'].to_list()

# upload in batches
BATCH_SIZE = 100

def generate_points_in_batches(batch_size=BATCH_SIZE):
    for i in range(0, len(df), batch_size):
        batch = df[i:i + batch_size]
        points = [
            PointStruct(
                id=idx,
                vector=dense_embeddings[idx],
                payload={
                    "product_code": row.get("product_code"),
                    "prod_name": row.get("prod_name"),
                    "product_group_name": row.get("product_group_name"),
                    "colour_group_name": row.get("colour_group_name"),
                    "department_name": row.get("department_name"),
                    "section_name": row.get("section_name"),
                    "garment_group_name": row.get("garment_group_name"),
                    "detail_desc": row.get("detail_desc"),
                    "image_url": row.get("image_url"),
                }
            )
            for idx, row in enumerate(batch.iter_rows(named=True), start=i)
        ]
        yield points

total_batches = (len(df) + BATCH_SIZE - 1) // BATCH_SIZE
for batch in tqdm(generate_points_in_batches(), total=total_batches, desc="Uploading points"):
    client.upload_points(
        collection_name="products",
        points=batch
    )
```

## 6. Search Vectors

Perform semantic search by passing a query text. Qdrant returns the most similar vectors based on your chosen distance metric.

```python
from fastembed import TextEmbedding

# load the embedding model
model = TextEmbedding('BAAI/bge-small-en-v1.5')

# generate query embedding
query_text = "blue jeans"
query_vector = next(iter(model.embed(query_text)))

# search for similar products
results = client.query_points(
    collection_name="products",
    query_vector=query_vector,
    limit=5
)

# print results
for result in results.hits:
    print(f"Product: {result.payload['prod_name']}")
    print(f"Score: {result.score}")
    print(f"Description: {result.payload.get('detail_desc', 'N/A')}")
    print("---")
```

## That's Vector Search!

You've just performed semantic search on real e-commerce data. The query "blue jeans" returned similar products based on meaning, not just keyword matching.

## What's Next?

- Explore [filtering](/documentation/concepts/filtering/) to combine semantic search with structured queries
- Learn about [collections](/documentation/concepts/collections/) and advanced configuration options
- Check out more [examples and tutorials](/documentation/tutorials-overview/)