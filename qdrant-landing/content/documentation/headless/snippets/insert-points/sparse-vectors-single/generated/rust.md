```rust
use qdrant_client::qdrant::{NamedVectors, PointStruct, UpsertPointsBuilder, Vector};

use qdrant_client::{Payload, Qdrant};

let client = Qdrant::from_url("http://localhost:6334").build()?;

let points = vec![PointStruct::new(
    1,
    NamedVectors::default().add_vector(
        "text",
        Vector::new_sparse(vec![1, 3, 5, 7], vec![0.1, 0.2, 0.3, 0.4]),
    ),
    Payload::new(),
)];

client
    .upsert_points(UpsertPointsBuilder::new("{collection_name}", points))
    .await?;
```
