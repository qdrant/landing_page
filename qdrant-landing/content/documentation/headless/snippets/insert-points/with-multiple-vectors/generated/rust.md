```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Payload;

client
    .upsert_points(
        UpsertPointsBuilder::new(
            "{collection_name}",
            vec![
                PointStruct::new(
                    1,
                    HashMap::from([
                        ("image".to_string(), vec![0.9, 0.1, 0.1, 0.2]),
                        (
                            "text".to_string(),
                            vec![0.4, 0.7, 0.1, 0.8, 0.1, 0.1, 0.9, 0.2],
                        ),
                    ]),
                    Payload::default(),
                ),
                PointStruct::new(
                    2,
                    HashMap::from([
                        ("image".to_string(), vec![0.2, 0.1, 0.3, 0.9]),
                        (
                            "text".to_string(),
                            vec![0.5, 0.2, 0.7, 0.4, 0.7, 0.2, 0.3, 0.9],
                        ),
                    ]),
                    Payload::default(),
                ),
            ],
        )
        .wait(true),
    )
    .await?;
```
