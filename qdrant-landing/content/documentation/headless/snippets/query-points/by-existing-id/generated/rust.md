```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Condition, Filter, PointId, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest(PointId::new("43cf51e2-8777-4f52-bc74-c2cbde0c8b04")))
    )
    .await?;
```
