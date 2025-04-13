```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Condition, Filter, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(vec![0.2, 0.1, 0.9, 0.7]))
    )
    .await?;
```
