```rust
use qdrant_client::qdrant::{with_payload_selector::SelectorOptions, QueryPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(3)
            .with_payload(SelectorOptions::Exclude(vec!["city".to_string()].into()))
            .with_vectors(true),
    )
    .await?;
```
