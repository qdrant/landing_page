```rust
let result = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(query_text, dense_model)))
            .using("dense_vector")
            .limit(5),
    )
    .await?;

for hit in result.result {
    println!("{:?}", hit);
}
```
