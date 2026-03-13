```rust
client
    .upsert_points(UpsertPointsBuilder::new(
        new_collection,
        vec![PointStruct::new(
            1,
            // Use the new embedding model to encode the document
            Document::new("Example document", new_model),
            [("text", "Example document".into())],
        )],
    ))
    .await?;
```
