```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PointId, Query, QueryPointsBuilder};

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(PointId::from("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
    )
    .await?;
```
