```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder};

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_text("time travel"))
            .using("title")
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
