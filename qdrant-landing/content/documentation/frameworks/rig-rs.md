---
title: Rig-rs
---

# Rig-rs

[Rig](http://rig.rs) is a Rust library for building scalable, modular, and ergonomic LLM-powered applications. It has full support for LLM completion and embedding workflows with minimal boiler plate.

Rig supports Qdrant as a vectorstore to ingest and search for documents semantically.

## Installation

```console
cargo add rig-core rig-qdrant qdrant-client
```

## Usage

Here's an example ingest and retrieve flow using Rig and Qdrant.

```rust
use qdrant_client::{
    qdrant::{PointStruct, QueryPointsBuilder, UpsertPointsBuilder},
    Payload, Qdrant,
};
use rig::{
    embeddings::EmbeddingsBuilder,
    providers::openai::{Client, TEXT_EMBEDDING_3_SMALL},
    vector_store::VectorStoreIndex,
};
use rig_qdrant::QdrantVectorStore;
use serde_json::json;

const COLLECTION_NAME: &str = "rig-collection";

// Initialize Qdrant client.
let client = Qdrant::from_url("http://localhost:6334").build()?;
// Initialize OpenAI client.
let openai_client = Client::new("<OPENAI_API_KEY>");
let model = openai_client.embedding_model(TEXT_EMBEDDING_3_SMALL);

let documents = EmbeddingsBuilder::new(model.clone())
    .simple_document("0981d983-a5f8-49eb-89ea-f7d3b2196d2e", "Definition of a *flurbo*: A flurbo is a green alien that lives on cold planets")
    .simple_document("62a36d43-80b6-4fd6-990c-f75bb02287d1", "Definition of a *glarb-glarb*: A glarb-glarb is a ancient tool used by the ancestors of the inhabitants of planet Jiro to farm the land.")
    .simple_document("f9e17d59-32e5-440c-be02-b2759a654824", "Definition of a *linglingdong*: A term used by inhabitants of the far side of the moon to describe humans.")
    .build()
    .await?;

let points: Vec<PointStruct> = documents
    .into_iter()
    .map(|d| {
        let vec: Vec<f32> = d.embeddings[0].vec.iter().map(|&x| x as f32).collect();
        PointStruct::new(
            d.id,
            vec,
            Payload::try_from(json!({
                "document": d.document,
            }))
            .unwrap(),
        )
    })
    .collect();

client
    .upsert_points(UpsertPointsBuilder::new(COLLECTION_NAME, points))
    .await?;

let query_params = QueryPointsBuilder::new(COLLECTION_NAME).with_payload(true);
let vector_store = QdrantVectorStore::new(client, model, query_params.build());

let results = vector_store
    .top_n::<serde_json::Value>("Define a glarb-glarb?", 1)
    .await?;

println!("Results: {:?}", results);
```

## Further reading

- [Rig-rs Documentation](https://rig.rs)
- [Source Code](https://github.com/0xPlaygrounds/rig)
