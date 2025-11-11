```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Fusion, PrefetchQueryBuilder, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        // .add_prefetch(...)  <┐
        // .add_prefetch(...)  <┴─ 2+ prefetches here
        .query(Query::new_rrf(Rrf { k: 60 })) <-- TODO
).await?;
```
