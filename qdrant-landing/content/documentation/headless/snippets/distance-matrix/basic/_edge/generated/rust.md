```rust
use qdrant_edge::*;

let response = edge_shard.search_matrix(
    SearchMatrixRequestBuilder::new(10, 2, DEFAULT_VECTOR_NAME.to_string())
        .filter(Filter::new_must(Condition::Field(FieldCondition::new_match(
            "color".try_into().unwrap(),
            "red".to_string().into(),
        ))))
        .build(),
)?;

// Qdrant Edge doesn't support the output formats. It returns the sampled
// point IDs and the nearest points of each sample. Convert them into
// (a, b, score) pairs yourself.
let pairs: Vec<(PointId, PointId, f32)> = response
    .sample_ids
    .iter()
    .zip(&response.nearests)
    .flat_map(|(a, nearest)| nearest.iter().map(move |point| (*a, point.id, point.score)))
    .collect();
```
