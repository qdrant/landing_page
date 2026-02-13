```rust
let query_result = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(
                "alien invasion",
                embedding_model,
            )))
            .limit(3)
            .with_payload(true),
    )
    .await?;

for hit in query_result.result {
    println!("{:?} score: {}", hit.payload, hit.score);
}
```
