```rust
use std::collections::HashMap;

use qdrant_client::qdrant::{
    PointVectors, UpdatePointVectorsBuilder,
};

client
    .update_vectors(
        UpdatePointVectorsBuilder::new(
            "{collection_name}",
            vec![
                PointVectors {
                    id: Some(1.into()),
                    vectors: Some(
                        HashMap::from([("image".to_string(), vec![0.1, 0.2, 0.3, 0.4])]).into(),
                    ),
                },
                PointVectors {
                    id: Some(2.into()),
                    vectors: Some(
                        HashMap::from([(
                            "text".to_string(),
                            vec![0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
                        )])
                        .into(),
                    ),
                },
            ],
        )
        .wait(true),
    )
    .await?;
```
