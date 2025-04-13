```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder, Vector};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let points = vec![
    PointStruct::new(
        1,
        Vector::new_multi(vec![
            vec![-0.013, 0.020, -0.007, -0.111],
            vec![-0.030, -0.055, 0.001, 0.072],
            vec![-0.041, 0.014, -0.032, -0.062],
        ]),
        Payload::new()
    )
];

client
    .upsert_points(
        UpsertPointsBuilder::new("{collection_name}", points)
    ).await?;

```
