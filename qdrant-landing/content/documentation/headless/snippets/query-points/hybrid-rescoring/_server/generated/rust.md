```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![1.0, 23.0, 45.0, 67.0]))
            .using("mlr_byte")
            .limit(1000u64)
        )
        .query(Query::new_nearest(vec![0.01, 0.299, 0.45, 0.67]))
        .using("full")
        .limit(10u64)
).await?;
```
