```rust
client
    .upsert_points(UpsertPointsBuilder::new(
        old_collection,
        vec![PointStruct::new(
            1,
            Document::new("Example document", old_model),
            [("text", "Example document".into())],
        )],
    ))
    .await?;
```
