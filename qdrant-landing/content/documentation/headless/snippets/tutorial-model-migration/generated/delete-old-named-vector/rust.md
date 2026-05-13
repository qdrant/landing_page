```rust
client
    .delete_vector_name(DeleteVectorNameRequestBuilder::new(
        collection,
        old_vector,
    ))
    .await?;
```
