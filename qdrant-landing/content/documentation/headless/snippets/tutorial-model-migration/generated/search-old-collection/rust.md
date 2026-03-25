```rust
let results = client
    .query(
        QueryPointsBuilder::new(old_collection)
            .query(Query::new_nearest(Document::new("my query", old_model)))
            .limit(10),
    )
    .await?;
```
