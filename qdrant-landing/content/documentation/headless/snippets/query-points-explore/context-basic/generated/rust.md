```rust
use qdrant_client::qdrant::{ContextInputBuilder, QueryPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}").query(
            ContextInputBuilder::default()
                .add_pair(100, 718)
                .add_pair(200, 300)
                .build(),
        ),
    )
    .await?;
```
