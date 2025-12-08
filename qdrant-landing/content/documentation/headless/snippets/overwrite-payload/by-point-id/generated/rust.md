```rust
use qdrant_client::qdrant::{PointsIdsList, SetPayloadPointsBuilder};
use qdrant_client::Payload;
use serde_json::json;

client
    .overwrite_payload(
        SetPayloadPointsBuilder::new(
            "{collection_name}",
            Payload::try_from(json!({
                "property1": "string",
                "property2": "string",
            }))
            .unwrap(),
        )
        .points_selector(PointsIdsList {
            ids: vec![0.into(), 3.into(), 10.into()],
        })
        .wait(true),
    )
    .await?;
```
