```rust
use qdrant_client::qdrant::{ClearPayloadPointsBuilder, PointsIdsList};

client
    .clear_payload(
        ClearPayloadPointsBuilder::new("{collection_name}")
            .points(PointsIdsList {
                ids: vec![0.into(), 3.into(), 10.into()],
            })
            .wait(true),
    )
    .await?;
```
