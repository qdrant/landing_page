```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder, Sample};

let sampled = client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_sample(Sample::Random))
    )
    .await?;
```
