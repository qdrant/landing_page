```rust
let config = EdgeConfigBuilder::new()
    .sparse_vector("text", EdgeSparseVectorParamsBuilder::new()
        .modifier(Modifier::Idf)
        .build())
    .build();

let shard = EdgeShard::new(Path::new(SHARD_DIRECTORY), config)?;
```
