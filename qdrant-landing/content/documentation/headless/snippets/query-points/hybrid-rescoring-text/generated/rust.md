```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
                    .using("dense")
                    .limit(100u64),
            )
            .query(Query::new_text("time travel"))
            .using("title")
            .limit(10u64),
    )
    .await?;
```
