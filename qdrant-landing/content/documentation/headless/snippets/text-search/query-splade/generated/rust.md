```rust
use qdrant_client::qdrant::{DocumentBuilder, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("time travel", "prithivida/splade_pp_en_v1").build(),
            ))
            .using("title-splade")
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
