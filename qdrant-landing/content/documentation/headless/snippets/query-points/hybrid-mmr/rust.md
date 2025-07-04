```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67])) // <-- search vector
            .limit(100u64)
        )
        .query(Query::new_mmr(
            vec![0.01, 0.45, 0.67], // <-- same vector
            0.5, // lambda
        ))
).await?;
```
