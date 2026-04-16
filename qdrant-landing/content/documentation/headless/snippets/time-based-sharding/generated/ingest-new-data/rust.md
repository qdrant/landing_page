```rust
client
    .upsert_points(
        UpsertPointsBuilder::new(
            collection_name,
            vec![PointStruct::new(
                uuid::Uuid::new_v4().to_string(),
                HashMap::from([(
                    "dense_vector".to_string(),
                    DocumentBuilder::new(
                        "The best way to start a Wednesday is with a cup of coffee",
                        dense_model,
                    )
                    .build(),
                )]),
                [
                    ("text", "The best way to start a Wednesday is with a cup of coffee".into()),
                    ("datetime", "2026-04-08T07:57:47".into()),
                ],
            )],
        )
        .shard_key_selector(today.to_string()),
    )
    .await?;
```
