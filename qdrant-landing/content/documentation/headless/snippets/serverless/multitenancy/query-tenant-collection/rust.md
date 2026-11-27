```rust
use qdrant_client::serverless::{Document, Query, QueryPointsBuilder};

let results = client
    .query(
        QueryPointsBuilder::new(format!("tenant-{tenant_id}"))
            .query(Query::new_nearest(Document::new(
                "quarterly report",
                "sentence-transformers/all-minilm-l6-v2",
            )))
            .limit(10),
    )
    .await?;
```
