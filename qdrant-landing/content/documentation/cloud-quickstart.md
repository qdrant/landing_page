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

```bash
# test the connection
curl -X GET \
  'http://<your-qdrant-host>:6333/collections' \
  --header 'api-key: <api-key-value>'
```

## 4. Create a Collection

Collections are the primary unit of data organization in Qdrant. Each collection stores vectors of the same dimensionality.

Specify the **vector size** (matching your embedding model) and the **distance metric** (Cosine, Euclidean, or Dot Product).

```python
from qdrant_client.models import Distance, VectorParams

# create a collection with 768-dimensional vectors
collection_name = "movies"
client.create_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(
        size=768,
        distance=Distance.COSINE
    )
)
```

```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder, ScalarQuantizationBuilder};

// -- snip --
let collection_name = "movies";
client
  .create_collection(
      CreateCollectionBuilder::new(collection_name)
          .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
          .quantization_config(ScalarQuantizationBuilder::default()),
  )
  .await?;
```

```typescript
const collectionName = "movies";
await client.collections.createCollection(collectionName, {
  vectors: {
    size: 768,
    distance: "Cosine",
  },    
});
```

```bash
curl -X PUT \
  'http://<your-qdrant-host>:6333/collections/movies' \
  --header 'api-key: <api-key-value>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "vectors": {
        "size": 768,
        "distance": "Cosine"
    }
}'
```

## 5. Load and Insert Vectors

We'll use a sample qdrant snapshot to quickly load data. It is a dataset of IMDB movies embedded with the `jinaai/jina-embeddings-v2-base-en` model.

```python
client.recover_snapshot(
    collection_name="products",
    snapshot_url="snapshots.qdrant.io/imdb-1000-jina.snapshot"
)
```

```rust
// recovering from snapshot is not yet supported in Rust client
// please use bash/cURL to restore from the snapshot manually
```

```typescript
await client.collections.recoverSnapshot("products", {
  snapshotUrl: "snapshots.qdrant.io/imdb-1000-jina.snapshot",
});
```

```curl
curl -X PUT \
  'http://<your-qdrant-host>:6333/collections/collection_name/snapshots/recover' \
  --header 'api-key: <api-key-value>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "location": "snapshots.qdrant.io/imdb-1000-jina.snapshot"
}'
```

## 6. Search Vectors

Perform semantic search by passing a query text. Qdrant returns the most similar vectors based on your chosen distance metric.

```python
from fastembed import TextEmbedding

# load the embedding model
model = TextEmbedding('jinaai/jina-embeddings-v2-base-en')

# generate query embedding
query_text = "alien invasion movie"
query_vector = next(iter(model.embed(query_text)))

# search for similar products
results = client.query_points(
    collection_name="movies",
    query_vector=query_vector,
    limit=5
)

# print results
for result in results.hits:
    print(f"Movie: {result.payload['prod_name']}")
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
let query_text = "alien invasion movie";
let query_embeddings = model.embed(vec![query_text], None)?;
let query_vector = query_embeddings[0].clone();

// search for similar products
let results = client
    .query(
        QueryPointsBuilder::new("movies")
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
  model: EmbeddingModel.JinaEmbeddingsV2BaseEn,
});

// generate query embedding
const queryText = "alien invasion movie";
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

You've just performed semantic search on real movie data. The query "alien invasion movie" returned similar movies based on meaning, not just keyword matching.

## What's Next?

- Explore [filtering](/documentation/concepts/filtering/) to combine semantic search with structured queries
- Learn about [collections](/documentation/concepts/collections/) and advanced configuration options
- Check out more [examples and tutorials](/documentation/tutorials-overview/)