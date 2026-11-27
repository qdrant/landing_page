```rust
use qdrant_client::serverless::{Document, Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let query = "a vegetarian dish with tahini";

let results = client
    .query(
        QueryPointsBuilder::new("menu")
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new(query, MODEL)))
                    .using("dense")
                    .limit(10u64),
            )
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_text(query))
                    .using("description")
                    .limit(10u64),
            )
            .query(Query::new_fusion(Fusion::Rrf))
            .limit(3)
            .with_payload(true),
    )
    .await?;

for hit in results.result {
    println!("{} {}", hit.payload["name"], hit.score);
}
```
