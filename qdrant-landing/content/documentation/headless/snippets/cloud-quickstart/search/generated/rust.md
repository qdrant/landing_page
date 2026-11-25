```rust
use qdrant_client::qdrant::{DocumentBuilder, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

let query_text = "vegetarian dishes";

let results = client
    .query(
        QueryPointsBuilder::new("items")
            .query(Query::new_nearest(
                DocumentBuilder::new(query_text, "sentence-transformers/all-MiniLM-L6-v2").build(),
            ))
            .with_payload(true)
            .limit(5),
    )
    .await?;

for result in results.result {
    let payload = result.payload;
    println!("Item: {}", payload.get("item_name").and_then(|v| v.as_str()).map_or("N/A", |s| s.as_str()));
    println!("Score: {}", result.score);
    println!("Description: {}", payload.get("description").and_then(|v| v.as_str()).map_or("N/A", |s| s.as_str()));
    println!("Price: {}", payload.get("price").and_then(|v| v.as_str()).map_or("N/A", |s| s.as_str()));
    println!("---");
}
```
