```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder, Vector};
use qdrant_client::Payload;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![
                PointStruct::new(
                    1,
                    HashMap::from([("text".to_string(), vec![(6, 1.0), (7, 2.0)])]),
                    Payload::default(),
                ),
                PointStruct::new(
                    2,
                    HashMap::from([(
                        "text".to_string(),
                        vec![(1, 0.1), (2, 0.2), (3, 0.3), (4, 0.4), (5, 0.5)],
                    )]),
                    Payload::default(),
                ),
            ],
        )
        .wait(true),
    )
    .await?;
```
