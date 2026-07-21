```rust
const QUERY: &str = "Where exactly to set `QDRANT__SERVICE__API_KEY` variable to enable authentication for a self-hosted Qdrant?";

client
    .query(
        QueryPointsBuilder::new(COLLECTION)
            .query(Query::new_nearest(Document::new(QUERY, MODEL)))
            .limit(3)
            .with_payload(PayloadIncludeSelector::new(vec![
                "section_url".to_string(),
                "text".to_string(),
            ])),
    )
    .await?;
```
