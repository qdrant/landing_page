```rust
let query_result_filtered = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(Document::new(
                "alien invasion",
                embedding_model,
            )))
            .filter(Filter::must([Condition::range(
                "year",
                Range {
                    gte: Some(2000.0),
                    ..Default::default()
                },
            )]))
            .limit(1)
            .with_payload(true),
    )
    .await?;

for hit in query_result_filtered.result {
    println!("{:?} score: {}", hit.payload, hit.score);
}
```
