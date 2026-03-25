```rust
let results = client
    .query(
        QueryPointsBuilder::new(new_collection)
            .query(Query::new_nearest(Document::new("my query", new_model)))
            .limit(10),
    )
    .await?;
```
