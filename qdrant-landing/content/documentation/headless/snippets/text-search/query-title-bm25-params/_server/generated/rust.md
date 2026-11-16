```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder, TextQueryBuilder};

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_text(
                TextQueryBuilder::new("time travel").k(1.5).b(0.5),
            ))
            .using("title")
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
