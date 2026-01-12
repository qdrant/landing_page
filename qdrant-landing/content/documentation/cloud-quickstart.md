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

Learn how to set up Qdrant Cloud and perform your first semantic search in just a few minutes. We'll use a sample dataset of 1,000 IMDB movies pre-embedded with the `jinaai/jina-embeddings-v2-base-en` model to get you started quickly.

## 1. Create a Cloud Cluster

1. Register for a [Cloud account](https://cloud.qdrant.io/signup) with your email, Google or Github credentials.
2. Go to **Clusters** and click **Create First Cluster**.
3. Copy your **API key** when prompted - you'll need it to connect. Store it somewhere safe as it won't be displayed again.

For detailed cluster setup instructions, see the [Cloud documentation](/documentation/cloud-intro/).

## 2. Install the Qdrant Client

Once you have a cluster, the fastest way to get started is to use our official SDKs which provide a convenient interface for working with Qdrant in your preferred programming language.

```bash
pip install qdrant-client fastembed             # for Python projects
# cargo add qdrant-client fastembed             # for Rust projects 
# npm install @qdrant/js-client-rest fastembed  # for Node.js projects
```

## 3. Connect to Qdrant Cloud

Import the qdrant client and create a connection to your Qdrant Cloud cluster using your cluster URL and API key.

```python
from qdrant_client import QdrantClient

# connect to Qdrant Cloud
client = QdrantClient(
    url="https://xyz-example.eu-central.aws.cloud.qdrant.io",
    api_key="your-api-key",
)
```

```rust
use qdrant_client::Qdrant;

// Connect to Qdrant Cloud
let client = Qdrant::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io:6334")
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

## 4. Load the Sample Dataset

We'll load a pre-embedded dataset of 1,000 H&M products using a [Qdrant snapshot](https://qdrant.tech/documentation/concepts/snapshots/). This snapshot contains vectors created with the `BAAI/bge-small-en-v1.5` model (384 dimensions) and will automatically create the collection for you.

```python
client.recover_snapshot("products", "https://snapshots.qdrant.io/hm_ecommerce_bge_small_v1.5_en.snapshot")
```

```rust
// recovering from snapshot is not yet supported in Rust client
// please use bash/cURL to restore from the snapshot manually
```

```typescript
await client.recoverSnapshot("products", {
  location: "https://snapshots.qdrant.io/hm_ecommerce_bge_small_v1.5_en.snapshot",
});
```

```curl
curl -X PUT \
  'http://<your-qdrant-host>:6333/collections/products/snapshots/recover' \
  --header 'api-key: <api-key-value>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "location": "https://snapshots.qdrant.io/hm_ecommerce_bge_small_v1.5_en.snapshot"
}'
```

## 5. Search the Products
Now we can search the product dataset! We'll use the same `BAAI/bge-small-en-v1.5` model to embed our query text, then find similar products in the collection.

```python
from fastembed import TextEmbedding

# load the embedding model
model = TextEmbedding('BAAI/bge-small-en-v1.5')

# generate query embedding
query_text = "womens graphic tee shirt"
query_vector = next(iter(model.embed(query_text)))

# search for similar products
results = client.query_points(
    collection_name="products",
    query=query_vector,
    limit=5
)

# print results
for result in results.points:
    print(f"Product: {result.payload.get('prod_name', 'N/A')}")
    print(f"Score: {result.score}")
    print(f"Description: {result.payload['detail_desc'][:50]}...")
    print("---")
```

```rust
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};

// load the embedding model
let mut model = TextEmbedding::try_new(
    InitOptions::new(EmbeddingModel::JinaEmbeddingsV2BaseEN)
        .with_show_download_progress(true),
)
.expect("Failed to load embedding model");

// generate query embedding
let query_text = "womens graphic tee shirt";
let query_embeddings = model
    .embed(vec![query_text], None)
    .expect("Failed to generate embeddings");
let query_vector = query_embeddings[0].clone();

let results = client
    .query(
        QueryPointsBuilder::new("products")
            .query(query_vector)
            .with_payload(true)
            .limit(5),
    )
    .await
    .expect("Query failed");

let na_str = "N/A".to_string();
for result in results.result {
    let payload = result.payload;
    println!("Product: {}", payload.get("prod_name")
        .and_then(|v| v.as_str()).unwrap_or(&na_str));
    println!("Score: {}", result.score);
    println!("Description: {}", payload.get("detail_desc")
        .and_then(|v| v.as_str()).unwrap_or(&na_str));
    println!("---");
}
```

```typescript
import { TextEmbedding, EmbeddingModel } from 'fastembed';

// load the embedding model
const model = await TextEmbedding.init({
  model: EmbeddingModel.BgaSmallEnV15,
});

// generate query embedding
const queryText = "womens graphic tee shirt";
const queryEmbeddings = await model.embed([queryText]);
const queryVector = Array.from(queryEmbeddings[0]);

// search for similar products
const results = await client.query("products", {
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

You've just performed semantic search on real product data. The query "womens graphic tee shirt" returned similar products based on meaning, not just keyword matching.

## What's Next?

- Explore [filtering](/documentation/concepts/filtering/) to combine semantic search with structured queries
- Learn about [collections](/documentation/concepts/collections/) and advanced configuration options
- Check out more [examples and tutorials](/documentation/tutorials-overview/)