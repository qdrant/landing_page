```rust
use qdrant_edge::*;
use serde_json::json;

let documents: Vec<PointStructPersisted> = vec![
    PointStruct::new(
        200u64,
        NamedVectors::default(),
        json!({"title": "Document A", "text": "This is document A"}),
    )
    .into(),
    PointStruct::new(
        201u64,
        NamedVectors::default(),
        json!({"title": "Document B", "text": "This is document B"}),
    )
    .into(),
];
documents_shard.update(UpdateOperation::PointOperation(PointOperations::UpsertPoints(
    PointInsertOperations::PointsList(documents),
)))?;

let chunks: Vec<PointStructPersisted> = vec![
    PointStruct::new(0u64, vec![0.1f32, 0.2, 0.3, 0.4], json!({"document_id": 200})).into(),
    PointStruct::new(1u64, vec![0.5f32, 0.6, 0.7, 0.8], json!({"document_id": [200, 201]})).into(),
];
chunks_shard.update(UpdateOperation::PointOperation(PointOperations::UpsertPoints(
    PointInsertOperations::PointsList(chunks),
)))?;
```
