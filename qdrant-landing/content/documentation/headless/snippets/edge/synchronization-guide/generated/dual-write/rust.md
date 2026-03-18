```rust
const SYNC_TIMESTAMP_KEY: &str = "timestamp";
let id = 2u64;
let vector = vec![0.4f32, 0.3, 0.2, 0.1];
let timestamp = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs_f64();
let payload = json!({
    "color": "green",
    SYNC_TIMESTAMP_KEY: timestamp,
});

let edge_points: Vec<PointStructPersisted> = vec![
    EdgePoint::new(
        PointId::NumId(id),
        Vectors::new_named([(VECTOR_NAME, vector.clone())]),
        payload.clone(),
    )
    .into(),
];
mutable_shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(
        PointInsertOperations::PointsList(edge_points),
    ),
))?;

let rest_point = PointStruct::new(
    id,
    HashMap::from([(VECTOR_NAME.to_string(), vector)]),
    payload.as_object().cloned().unwrap_or_default(),
);
upload_queue.push_back(rest_point);
```
