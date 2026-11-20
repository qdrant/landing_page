```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    Condition, Direction, Filter, OrderByBuilder, PrefetchQueryBuilder, Query,
    QueryPointsBuilder, Range,
};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .add_prefetch(PrefetchQueryBuilder::default()
            .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
            .filter(Filter::must([Condition::range(
                "price",
                Range {
                    gte: Some(10.0),
                    lte: Some(80.0),
                    ..Default::default()
                },
            )]))
            .limit(100u64)
        )
        .query(Query::new_order_by(
            OrderByBuilder::new("price").direction(Direction::Asc.into()),
        ))
        .limit(10u64)
        .with_payload(true)
).await?;
```
