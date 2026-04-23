```rust
let query_text = "coffee";

let result = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(query_text, dense_model)))
            .using("dense_vector")
            .limit(5)
            .shard_key_selector("2026-04-07".to_string()),
    )
    .await?;

for hit in result.result {
    println!("{:?}", hit);
}
```
