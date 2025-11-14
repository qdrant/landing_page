```rust
use qdrant_client::{
    Payload, Qdrant, QdrantError,
    qdrant::{Document, PointStruct, UpsertPointsBuilder},
};

let client = Qdrant::from_url("<your-qdrant-url>").build()?;

client
    .upsert_points(UpsertPointsBuilder::new("{collection_name}",
        vec![
            PointStruct::new(1,
                HashMap::from([("my-bm25-vector".to_string(),
                    Document {
                      text: "Recipe for baking chocolate chip cookies".into(),
                      model: "qdrant/bm25".into(),
                      ..Default::default()
                      }.into())]),
                Payload::default())
            ]))
        .await?;
```
