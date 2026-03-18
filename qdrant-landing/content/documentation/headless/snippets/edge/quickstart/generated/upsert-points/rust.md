```rust
let points: Vec<PointStructPersisted> = vec![
    PointStruct::new(
        1u64,
        Vectors::new_named([(VECTOR_NAME, vec![0.1f32, 0.2, 0.3, 0.4])]),
        json!({"color": "red"}),
    )
    .into(),
];

edge_shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(
        PointInsertOperations::PointsList(points),
    ),
))?;
```
