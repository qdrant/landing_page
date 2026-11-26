```rust
use qdrant_client::serverless::{Document, Query, QueryPointsBuilder};

let results = client
    .query(
        QueryPointsBuilder::new("menu")
            .query(Query::new_nearest(Document::new("vegetarian dishes", MODEL)))
            .using("dense")
            .limit(3)
            .with_payload(true),
    )
    .await?;

for hit in results.result {
    println!("{} {}", hit.payload["name"], hit.score);
}
```
