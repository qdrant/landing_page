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

<p align="center"><iframe width="560" height="315" src="https://www.youtube.com/embed/xvWIssi_cjQ?si=CLhFrUDpQlNog9mz&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></p>

Learn how to set up Qdrant Cloud, create a collection, insert vectors, and perform your first semantic search in just a few minutes.

## 1. Install the Qdrant Client

The fastest way to get started is to use the `qdrant-client` Python library which provides a convenient interface for working with Qdrant.

Install it using pip in your terminal or virtual environment:

```bash
pip install qdrant-client polars fastembed tqdm         # for Python projects
# cargo add qdrant-client[fastembed] polars             # for Rust projects 
# npm install @qdrant/js-client-rest polars fastembed   # for Node.js projects
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

```rust
use qdrant_client::Qdrant;

// Connect to Qdrant Cloud
let client = Qdrant::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io")
    .api_key("your-api-key")
    .build()?;
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "https://xyz-example.eu-central.aws.cloud.qdrant.io",
  apiKey: "your-api-key",
});
```


## 4. Create a Collection

Collections are the primary unit of data organization in Qdrant. Each collection stores vectors of the same dimensionality.

Specify the **vector size** (matching your embedding model) and the **distance metric** (Cosine, Euclidean, or Dot Product).

```python
from qdrant_client.models import Distance, VectorParams

# create a collection with 384-dimensional vectors
collection_name = "products"
client.create_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size=384,
        distance=Distance.COSINE
    )
)
```

```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder, ScalarQuantizationBuilder};

// -- snip --
let collection_name = "products";
client
  .create_collection(
      CreateCollectionBuilder::new(collection_name)
          .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine))
          .quantization_config(ScalarQuantizationBuilder::default()),
  )
  .await?;
```

```typescript
const collectionName = "products";
await client.collections.createCollection(collectionName, {
  vectors: {
    size: 384,
    distance: "Cosine",
  },
});
```

## 5. Load and Insert Vectors

We'll use a real dataset from HuggingFace containing H&M e-commerce products with pre-computed embeddings.

```python
import polars as pl

from qdrant_client.models import PointStruct
from tqdm import tqdm

df = pl.read_parquet('hf://datasets/Qdrant/hm_ecommerce_products/hm_ecommerce_products_enriched.parquet')

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

```rust
use polars::prelude::*;
use qdrant_client::qdrant::{PointStruct, Value};
use std::collections::HashMap;

// read parquet file from HuggingFace
let url = "https://huggingface.co/datasets/Qdrant/hm_ecommerce_products/resolve/main/hm_ecommerce_products_enriched.parquet";
let df = LazyFrame::scan_parquet(url, Default::default())?
    .collect()?;

// extract dense embeddings
let dense_embeddings = df.column("dense_embedding")?
    .list()?
    .into_iter()
    .map(|series| {
        series.unwrap().f32()?.into_iter()
            .map(|v| v.unwrap())
            .collect::<Vec<f32>>()
    })
    .collect::<Vec<Vec<f32>>>();

// upload in batches
const BATCH_SIZE: usize = 100;

let total_rows = df.height();
let total_batches = (total_rows + BATCH_SIZE - 1) / BATCH_SIZE;

for batch_start in (0..total_rows).step_by(BATCH_SIZE) {
    let batch_end = (batch_start + BATCH_SIZE).min(total_rows);
    let mut points = Vec::new();

    for idx in batch_start..batch_end {
        let mut payload = HashMap::new();
        payload.insert("product_code".to_string(),
            Value::from(df.column("product_code")?.str()?.get(idx).unwrap_or("")));
        payload.insert("prod_name".to_string(),
            Value::from(df.column("prod_name")?.str()?.get(idx).unwrap_or("")));
        payload.insert("product_group_name".to_string(),
            Value::from(df.column("product_group_name")?.str()?.get(idx).unwrap_or("")));
        payload.insert("colour_group_name".to_string(),
            Value::from(df.column("colour_group_name")?.str()?.get(idx).unwrap_or("")));
        payload.insert("department_name".to_string(),
            Value::from(df.column("department_name")?.str()?.get(idx).unwrap_or("")));
        payload.insert("section_name".to_string(),
            Value::from(df.column("section_name")?.str()?.get(idx).unwrap_or("")));
        payload.insert("garment_group_name".to_string(),
            Value::from(df.column("garment_group_name")?.str()?.get(idx).unwrap_or("")));
        payload.insert("detail_desc".to_string(),
            Value::from(df.column("detail_desc")?.str()?.get(idx).unwrap_or("")));
        payload.insert("image_url".to_string(),
            Value::from(df.column("image_url")?.str()?.get(idx).unwrap_or("")));

        points.push(PointStruct::new(
            idx as u64,
            dense_embeddings[idx].clone(),
            payload,
        ));
    }

    client.upsert_points("products", points, None).await?;
}
```

```typescript
import * as pl from 'nodejs-polars';
import { PointStruct } from '@qdrant/js-client-rest';

// read parquet file from HuggingFace
const url = 'https://huggingface.co/datasets/Qdrant/hm_ecommerce_products/resolve/main/hm_ecommerce_products_enriched.parquet';
const df = await pl.readParquet(url);

// extract dense embeddings
const denseEmbeddings = df.getColumn('dense_embedding').toArray();

// upload in batches
const BATCH_SIZE = 100;
const totalRows = df.height;
const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

for (let batchStart = 0; batchStart < totalRows; batchStart += BATCH_SIZE) {
  const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRows);
  const points: PointStruct[] = [];

  for (let idx = batchStart; idx < batchEnd; idx++) {
    const row = df.row(idx);

    points.push({
      id: idx,
      vector: denseEmbeddings[idx],
      payload: {
        product_code: row.product_code,
        prod_name: row.prod_name,
        product_group_name: row.product_group_name,
        colour_group_name: row.colour_group_name,
        department_name: row.department_name,
        section_name: row.section_name,
        garment_group_name: row.garment_group_name,
        detail_desc: row.detail_desc,
        image_url: row.image_url,
      },
    });
  }

  await client.upsert(collectionName, {
    wait: true,
    points: points,
  });

}
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

```rust
use fastembed::{TextEmbedding, InitOptions, EmbeddingModel};

// load the embedding model
let model = TextEmbedding::try_new(InitOptions {
    model_name: EmbeddingModel::BGESmallENV15,
    ..Default::default()
})?;

// generate query embedding
let query_text = "blue jeans";
let query_embeddings = model.embed(vec![query_text], None)?;
let query_vector = query_embeddings[0].clone();

// search for similar products
let results = client
    .query(
        QueryPointsBuilder::new("products")
            .query(query_vector)
            .limit(5),
    )
    .await?;

// print results
for result in results.result {
    let payload = result.payload;
    println!("Product: {}", payload.get("prod_name")
        .and_then(|v| v.as_str()).unwrap_or("N/A"));
    println!("Score: {}", result.score);
    println!("Description: {}", payload.get("detail_desc")
        .and_then(|v| v.as_str()).unwrap_or("N/A"));
    println!("---");
}
```

```typescript
import { TextEmbedding, EmbeddingModel } from 'fastembed';

// load the embedding model
const model = await TextEmbedding.init({
  model: EmbeddingModel.BGESmallENV15,
});

// generate query embedding
const queryText = "blue jeans";
const queryEmbeddings = await model.embed([queryText]);
const queryVector = Array.from(queryEmbeddings[0]);

// search for similar products
const results = await client.query(collectionName, {
  query: queryVector,
  limit: 5,
});

// print results
for (const result of results.points) {
  console.log(`Product: ${result.payload?.prod_name || 'N/A'}`);
  console.log(`Score: ${result.score}`);
  console.log(`Description: ${result.payload?.detail_desc || 'N/A'}`);
  console.log('---');
}
```

## That's Vector Search!

You've just performed semantic search on real e-commerce data. The query "blue jeans" returned similar products based on meaning, not just keyword matching.

## What's Next?

- Explore [filtering](/documentation/concepts/filtering/) to combine semantic search with structured queries
- Learn about [collections](/documentation/concepts/collections/) and advanced configuration options
- Check out more [examples and tutorials](/documentation/tutorials-overview/)