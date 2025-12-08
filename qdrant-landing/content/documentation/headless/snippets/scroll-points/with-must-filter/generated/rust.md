```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([
            Condition::matches("city", "london".to_string()),
            Condition::matches("color", "red".to_string()),
        ])),
    )
    .await?;
```
