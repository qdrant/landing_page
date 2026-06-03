```rust
edge_shard.update(UpdateOperation::VectorNameOperation(
    VectorNameOperations::CreateVectorName(CreateVectorName {
        vector_name: "text".to_string(),
        config: VectorNameConfig::sparse(SparseVectorConfig {
            modifier: Some(Modifier::Idf),
            datatype: None,
        }),
    }),
))?;
```
