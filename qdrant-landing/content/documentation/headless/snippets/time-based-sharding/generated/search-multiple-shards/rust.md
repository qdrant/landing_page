```rust
let result = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(query_text, dense_model)))
            .using("dense_vector")
            .limit(5)
            .shard_key_selector(ShardKeySelector {
                shard_keys: vec![
                    "2026-04-06".to_string().into(),
                    "2026-04-07".to_string().into(),
                ],
                fallback: None,
            }),
    )
    .await?;

for hit in result.result {
    println!("{:?}", hit);
}
```
