```rust
use std::collections::HashMap;

use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder, Vector};

client
    .upsert_points(UpsertPointsBuilder::new(
        "documents",
        vec![
            PointStruct::new(
                200,
                HashMap::<String, Vector>::new(),
                [
                    ("title", "Document A".into()),
                    ("text", "This is document A".into()),
                ],
            ),
            PointStruct::new(
                201,
                HashMap::<String, Vector>::new(),
                [
                    ("title", "Document B".into()),
                    ("text", "This is document B".into()),
                ],
            ),
        ],
    ))
    .await?;

client
    .upsert_points(UpsertPointsBuilder::new(
        "chunks",
        vec![
            PointStruct::new(0, vec![0.1, 0.2, 0.3, 0.4], [("document_id", 200.into())]),
            PointStruct::new(1, vec![0.5, 0.6, 0.7, 0.8], [("document_id", 201.into())]),
        ],
    ))
    .await?;
```
