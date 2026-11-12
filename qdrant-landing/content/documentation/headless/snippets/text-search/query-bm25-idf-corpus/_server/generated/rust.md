```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    Condition, Filter, IdfParamsBuilder, Query, QueryPointsBuilder, SearchParamsBuilder,
};

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_text("time travel"))
            .using("title")
            .filter(Filter::must([
                Condition::matches("group_id", "user_1".to_string()),
                Condition::matches("year", 2024),
            ]))
            .params(SearchParamsBuilder::default().idf(
                IdfParamsBuilder::default().corpus(Filter::must([Condition::matches(
                    "group_id",
                    "user_1".to_string(),
                )])),
            ))
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
