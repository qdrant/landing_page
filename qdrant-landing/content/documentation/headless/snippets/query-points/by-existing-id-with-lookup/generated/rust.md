```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{LookupLocationBuilder, PointId, Query, QueryPointsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client.query(
    QueryPointsBuilder::new("{collection_name}")
        .query(Query::new_nearest("43cf51e2-8777-4f52-bc74-c2cbde0c8b04"))
        .using("512d-vector")
        .lookup_from(
            LookupLocationBuilder::new("another_collection")
                .vector_name("image-512")
        )
).await?;
```
