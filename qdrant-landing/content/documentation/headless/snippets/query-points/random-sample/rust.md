```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder};
let client = Qdrant::from_url("http://localhost:6334").build()?;

let sampled = client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_sample(Sample::Random))
    )
    .await?;

```
