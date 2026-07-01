```rust
use qdrant_edge::external::serde_json::json;
use qdrant_edge::*;

let docs = [
    (1u64, "the quick brown fox", "Article 1"),
    (2,    "a lazy dog sleeps",   "Article 2"),
    (3,    "foxes are clever",    "Article 3"),
];

let points = docs.iter().map(|(id, text, title)| {
    PointStruct::new(
        *id,
        Vectors::new_named([("text", bm25.embed_document(text))]),
        json!({ "title": title }),
    ).into()
}).collect();

shard.update(UpdateOperation::PointOperation(
    PointOperations::UpsertPoints(PointInsertOperations::PointsList(points)),
))?;
shard.optimize()?;
```
