```rust
let new_vector_results = client
    .query(
        QueryPointsBuilder::new(collection)
            .query(Query::new_nearest(Document::new("my query", new_model)))
            .using(new_vector)
            .limit(10),
    )
    .await?;
```
