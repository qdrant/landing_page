```rust
let query = "time travel";

let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(query, dense_embedding_model)))
            .using("dense")
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}
```
