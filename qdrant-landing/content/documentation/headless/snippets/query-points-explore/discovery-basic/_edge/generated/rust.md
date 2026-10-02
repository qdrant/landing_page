```rust
use std::collections::HashMap;

use qdrant_edge::*;

// Look up the stored vectors of the context points
let records = edge_shard.retrieve(
    RetrieveRequestBuilder::new([100, 718, 200, 300].map(PointId::from).to_vec())
        .with_payload(WithPayloadInterface::Bool(false))
        .with_vector(WithVector::Bool(true))
        .build(),
)?;
let mut vectors: HashMap<PointId, VectorInternal> = records
    .iter()
    .map(|record| {
        let vector = record.get_vector_by_name(DEFAULT_VECTOR_NAME).unwrap();
        (record.id, vector.to_owned())
    })
    .collect();
let mut take = |id: u64| vectors.remove(&PointId::from(id)).unwrap();

edge_shard.query(
    QueryRequestBuilder::new(10)
        .query(ScoringQuery::Vector(QueryEnum::Discover(NamedQuery {
            query: DiscoverQuery {
                target: vec![0.2f32, 0.1, 0.9, 0.7].into(),
                pairs: vec![
                    ContextPair {
                        positive: take(100),
                        negative: take(718),
                    },
                    ContextPair {
                        positive: take(200),
                        negative: take(300),
                    },
                ],
            },
            using: None,
        })))
        .build(),
)?;
```
