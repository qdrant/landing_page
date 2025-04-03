```rust
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                "5c56c793-69f3-4fbf-87e6-c4bf54c28c26",
                vec![0.9, 0.1, 0.1],
                [("color", "Red".into())],
            )],
        )
        .wait(true),
    )
    .await?;
```
