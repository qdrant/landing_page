```rust
use std::collections::HashMap;

use anyhow::Context;
use qdrant_edge::*;

// Look up the stored vectors of the example points
let records = edge_shard.retrieve(
    RetrieveRequestBuilder::new([100, 231, 718].map(PointId::from).to_vec())
        .with_payload(WithPayloadInterface::Bool(false))
        .with_vector(WithVector::Bool(true))
        .build(),
)?;
let mut vectors: HashMap<PointId, VectorInternal> = HashMap::new();
for record in &records {
    let vector = record
        .get_vector_by_name(DEFAULT_VECTOR_NAME)
        .context("point has no vector")?;
    vectors.insert(record.id, vector.to_owned());
}
let mut take = |id: u64| vectors.remove(&PointId::from(id)).context("point not found");

edge_shard.query(
    QueryRequestBuilder::new(3)
        .query(ScoringQuery::Vector(QueryEnum::RecommendBestScore(NamedQuery {
            query: RecommendQuery::new(
                vec![take(100)?, take(231)?],
                vec![take(718)?, vec![0.2f32, 0.3, 0.4, 0.5].into()],
            ),
            using: None,
        })))
        .filter(Filter::new_must(Condition::Field(FieldCondition::new_match(
            "city".try_into().unwrap(),
            "London".to_string().into(),
        ))))
        .build(),
)?;
```
