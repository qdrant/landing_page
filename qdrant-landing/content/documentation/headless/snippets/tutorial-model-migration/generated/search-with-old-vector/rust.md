```rust
let old_vector_results = client
    .query(
        QueryPointsBuilder::new(collection)
            .query(Query::new_nearest(Document::new("my query", old_model)))
            .using(old_vector)
            .limit(10),
    )
    .await?;
```
