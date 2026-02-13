```rust
client
    .create_field_index(
        CreateFieldIndexCollectionBuilder::new(collection_name, "year", FieldType::Integer)
            .wait(true),
    )
    .await?;
```
