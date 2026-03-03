```rust
let retrieved = edge_shard.retrieve(
    &[ExtendedPointId::NumId(1)],
    Some(WithPayloadInterface::Bool(true)),
    Some(WithVector::Bool(false)),
)?;
```
