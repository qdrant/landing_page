```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;
    
client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}")
            .filter(Filter::must([Condition::has_vector("image")])),
    )
    .await?;
```
