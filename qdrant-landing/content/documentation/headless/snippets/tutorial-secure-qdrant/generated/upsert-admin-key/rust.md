```rust
let client = Qdrant::from_url("https://localhost:6334")
    .api_key("my-admin-key")
    .build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("my_collection")
            .vectors_config(VectorParamsBuilder::new(4, Distance::Cosine)),
    )
    .await?;

client
    .upsert_points(UpsertPointsBuilder::new(
        "my_collection",
        vec![PointStruct::new(1, vec![0.1_f32, 0.2, 0.3, 0.4], [("source", "tutorial".into())])],
    ))
    .await?;
```
