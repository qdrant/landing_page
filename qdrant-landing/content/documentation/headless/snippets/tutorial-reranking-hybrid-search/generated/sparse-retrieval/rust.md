```rust
let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(query, sparse_embedding_model)))
            .using("sparse")
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}
```
