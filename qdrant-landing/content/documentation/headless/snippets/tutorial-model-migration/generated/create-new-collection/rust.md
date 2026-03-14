```rust
client
    .create_collection(
        CreateCollectionBuilder::new(new_collection)
            .vectors_config(VectorParamsBuilder::new(512, Distance::Cosine)), // Size of the new embedding vectors
    )
    .await?;
```
