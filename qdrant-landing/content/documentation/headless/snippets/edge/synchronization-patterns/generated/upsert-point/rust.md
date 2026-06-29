```rust
use std::collections::*;
use serde_json::json;
use qdrant_edge::{
    PointInsertOperations, PointOperations,
    PointStructPersisted, PointId, UpdateOperation, Vectors,
};

let id = 1u64;
let vector = vec![0.1f32, 0.2, 0.3, 0.4];
let payload = json!({"color": "red"});

let edge_points: Vec<PointStructPersisted> = vec![
    qdrant_edge::PointStruct::new(
        PointId::NumId(id),
        Vectors::new_named([(VECTOR_NAME, vector.clone())]),
        payload.clone(),
    )
    .into(),
];
edge_shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(
        PointInsertOperations::PointsList(edge_points),
    ),
))?;

let server_point = ::qdrant_client::qdrant::PointStruct::new(
    id,
    HashMap::from([(VECTOR_NAME.to_string(), vector)]),
    payload.as_object().cloned().unwrap_or_default(),
);
upload_queue.push_back(server_point);
```
