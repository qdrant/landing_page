```rust
use qdrant_client::qdrant::{
    Condition, Filter, QueryBatchPointsBuilder, QueryPointsBuilder,
    RecommendInputBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let filter = Filter::must([Condition::matches("city", "London".to_string())]);

let recommend_queries = vec![
    QueryPointsBuilder::new("{collection_name}")
        .query(
            RecommendInputBuilder::default()
                .add_positive(100)
                .add_positive(231)
                .add_negative(718)
                .build(),
        )
        .filter(filter.clone())
        .build(),
    QueryPointsBuilder::new("{collection_name}")
        .query(
            RecommendInputBuilder::default()
                .add_positive(200)
                .add_positive(67)
                .add_negative(300)
                .build(),
        )
        .filter(filter)
        .build(),
];

client
    .query_batch(QueryBatchPointsBuilder::new(
        "{collection_name}",
        recommend_queries,
    ))
    .await?;
```
