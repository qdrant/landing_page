```rust
use anyhow::Context;
use qdrant_client::qdrant::{Document, Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let dense_prefetch = PrefetchQueryBuilder::default()
    .query(Query::new_nearest(Document::new(query_text, dense_model)))
    .using("dense_vector")
    .limit(5u64)
    .build();

let bm25_prefetch = PrefetchQueryBuilder::default()
    .query(Query::new_text(query_text))
    .using("passage_text")
    .limit(5u64)
    .build();

let query_request = QueryPointsBuilder::new("{collection_name}")
    .add_prefetch(dense_prefetch)
    .add_prefetch(bm25_prefetch)
    .query(Query::new_fusion(Fusion::Rrf))
    .limit(5)
    .with_payload(true)
    .build();

let results = client.query(query_request).await?;

for point in results.result {
    let question = point
        .payload
        .get("question")
        .and_then(|v| v.as_str())
        .context("point has no question in its payload")?;
    println!("{:.3}  {}", point.score, question.trim());
}
```
