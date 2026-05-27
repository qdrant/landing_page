```rust
client
    .create_vector_name(
        CreateVectorNameRequestBuilder::new(
            collection,
            new_vector,
            DenseVectorCreationConfigBuilder::new(512, Distance::Cosine), // Size of the new embedding vectors
        ),
    )
    .await?;
```
