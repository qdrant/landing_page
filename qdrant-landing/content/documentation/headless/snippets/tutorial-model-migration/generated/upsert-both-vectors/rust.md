```rust
client
    .upsert_points(UpsertPointsBuilder::new(
        collection,
        vec![PointStruct::new(
            1,
            NamedVectors::default()
                .add_vector(
                    old_vector,
                    Document {
                        text: "Example document".into(),
                        model: old_model.into(),
                        ..Default::default()
                    },
                )
                .add_vector(
                    new_vector,
                    Document {
                        text: "Example document".into(),
                        model: new_model.into(),
                        ..Default::default()
                    },
                ),
            [("text", "Example document".into())],
        )],
    ))
    .await?;
```
