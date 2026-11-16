```rust
let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_text(query))
            .using("description")
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}
```
