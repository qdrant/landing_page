```rust
use qdrant_client::serverless::{Query, QueryPointsBuilder};

let results = client
    .query(
        QueryPointsBuilder::new("menu")
            .query(Query::new_text("tahini"))
            .using("description")
            .limit(3)
            .with_payload(true),
    )
    .await?;

for hit in results.result {
    println!("{} {}", hit.payload["name"], hit.score);
}
```
