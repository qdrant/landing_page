```rust
use qdrant_edge::external::serde_json::json;
use qdrant_edge::*;

let books: [(u64, [f32; 4], &str); 3] = [
    (1, [0.05, 0.61, 0.76, 0.74], "The Time Machine"),
    (2, [0.19, 0.81, 0.75, 0.11], "Time Travel in Einstein's Universe"),
    (3, [0.36, 0.55, 0.47, 0.94], "The Travels of Marco Polo"),
];

let points = books
    .iter()
    .map(|(id, embedding, title)| {
        PointStruct::new(
            *id,
            Vectors::new_named([("embedding", embedding.to_vec())]),
            json!({ "title": title }),
        )
        .into()
    })
    .collect();

shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(PointInsertOperations::PointsList(points)),
))?;
```
