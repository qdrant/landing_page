```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Condition, Filter, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .filter(Filter::must([Condition::matches(
                "color",
                "red".to_string(),
            )]))
            .limit(10u64)
        )
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .filter(Filter::must([Condition::matches(
                "color",
                "green".to_string(),
            )]))
            .limit(10u64)
        )
        .query(Query::new_order_by("price"))
).await?;
```
