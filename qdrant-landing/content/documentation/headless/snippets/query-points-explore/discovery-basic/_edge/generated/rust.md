```rust
use std::collections::HashMap;

use anyhow::Context;
use qdrant_edge::*;

// Look up the stored vectors of the context points
let points = edge_shard.retrieve(
    RetrieveRequestBuilder::new([100, 718, 200, 300].map(PointId::from).to_vec())
        .with_payload(WithPayloadInterface::Bool(false))
        .with_vector(WithVector::Bool(true))
        .build(),
)?;
let mut vectors: HashMap<PointId, VectorInternal> = HashMap::new();
for point in &points {
    let vector = point
        .get_vector_by_name(DEFAULT_VECTOR_NAME)
        .context("point has no vector")?;
    vectors.insert(point.id, vector.to_owned());
}
let mut take = |id: u64| vectors.remove(&PointId::from(id)).context("point not found");

edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(ScoringQuery::Vector(QueryEnum::Discover(NamedQuery {
            query: DiscoverQuery {
                target: vec![0.2f32, 0.1, 0.9, 0.7].into(),
                pairs: vec![
                    ContextPair {
                        positive: take(100)?,
                        negative: take(718)?,
                    },
                    ContextPair {
                        positive: take(200)?,
                        negative: take(300)?,
                    },
                ],
            },
            using: None,
        })))
        .build(),
)?;
```
