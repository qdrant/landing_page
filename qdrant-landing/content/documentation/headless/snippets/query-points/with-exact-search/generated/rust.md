```rust
use qdrant_client::qdrant::{QueryPointsBuilder, SearchParamsBuilder};
use qdrant_client::Qdrant;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.2, 0.1, 0.9, 0.7])
            .limit(10)
            .params(SearchParamsBuilder::default().exact(true)),
    )
    .await?;
```
