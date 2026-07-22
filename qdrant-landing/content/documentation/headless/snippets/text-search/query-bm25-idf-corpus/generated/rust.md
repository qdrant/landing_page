```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    Condition, Document, Filter, IdfParamsBuilder, Query, QueryPointsBuilder, SearchParamsBuilder,
};

client
    .query(
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(Document::new("time travel", "qdrant/bm25")))
            .using("title-bm25")
            .filter(Filter::must([
                Condition::matches("tenant", "acme".to_string()),
                Condition::matches("year", 2024),
            ]))
            .params(SearchParamsBuilder::default().idf(
                IdfParamsBuilder::default().corpus(Filter::must([Condition::matches(
                    "tenant",
                    "acme".to_string(),
                )])),
            ))
            .limit(10)
            .with_payload(true)
            .build(),
    )
    .await?;
```
