```rust
let results = client
    .query(
        QueryPointsBuilder::new(collection_name)
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new(query, dense_embedding_model)))
                    .using("dense")
                    .limit(20u64),
            )
            .add_prefetch(
                PrefetchQueryBuilder::default()
                    .query(Query::new_nearest(Document::new(query, sparse_embedding_model)))
                    .using("sparse")
                    .limit(20u64),
            )
            .query(Query::new_fusion(Fusion::Rrf))
            .with_payload(true)
            .limit(10),
    )
    .await?;

for result in results.result {
    println!("{:?}", result);
}
```
