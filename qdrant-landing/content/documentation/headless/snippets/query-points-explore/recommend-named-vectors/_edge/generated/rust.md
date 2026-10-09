```rust
use std::collections::HashMap;

use anyhow::Context;
use qdrant_edge::*;

// Look up the stored "image" vectors of the example points
let records = edge_shard.retrieve(
    RetrieveRequestBuilder::new([100, 231, 718].map(PointId::from).to_vec())
        .with_payload(WithPayloadInterface::Bool(false))
        .with_vector(WithVector::Selector(vec!["image".to_string()]))
        .build(),
)?;
let mut vectors: HashMap<PointId, VectorInternal> = HashMap::new();
for record in &records {
    let vector = record
        .get_vector_by_name("image")
        .context("point has no vector")?;
    vectors.insert(record.id, vector.to_owned());
}
let mut take = |id: u64| vectors.remove(&PointId::from(id)).context("point not found");

edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(ScoringQuery::Vector(QueryEnum::RecommendBestScore(NamedQuery {
            query: RecommendQuery::new(vec![take(100)?, take(231)?], vec![take(718)?]),
            using: Some("image".to_string()),
        })))
        .build(),
)?;
```
