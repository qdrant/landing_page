```rust
const SHARD_DIRECTORY: &str = "./qdrant-edge-bm25";

use std::path::*;
use qdrant_edge::*;

let config = EdgeConfigBuilder::new()
    .sparse_vector("text", EdgeSparseVectorParamsBuilder::new()
        .modifier(Modifier::Idf)
        .build())
    .build();

let shard = EdgeShard::new(Path::new(SHARD_DIRECTORY), config)?;

use qdrant_edge::bm25_embed::*;

let bm25 = EdgeBm25::new(EdgeBm25Config {
    language: Some("english".to_string()),
    ..Default::default()
})?;

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

use qdrant_edge::*;

let query_vector = bm25.embed_query("clever fox");

let results = shard.query(QueryRequest {
    prefetches: vec![],
    query: Some(ScoringQuery::Vector(QueryEnum::Nearest(NamedQuery {
        query: VectorInternal::from(query_vector),
        using: Some("text".to_string()),
    }))),
    filter: None,
    score_threshold: None,
    limit: 3,
    offset: 0,
    params: None,
    with_vector: WithVector::Bool(false),
    with_payload: WithPayloadInterface::Bool(true),
})?;
```
