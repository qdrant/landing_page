```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .limit(100u64)
        )
        .query(Query::new_nearest(vec![
            vec![0.1, 0.2],
            vec![0.2, 0.1],
            vec![0.8, 0.9],
        ]))
        .using("colbert")
        .limit(10u64)
).await?;
```
