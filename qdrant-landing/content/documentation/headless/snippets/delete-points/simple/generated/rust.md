```rust
use qdrant_client::qdrant::{DeletePointsBuilder, PointsIdsList};

client
    .delete_points(
        DeletePointsBuilder::new("{collection_name}")
            .points(PointsIdsList {
                ids: vec![0.into(), 3.into(), 100.into()],
            })
            .wait(true),
    )
    .await?;
```
