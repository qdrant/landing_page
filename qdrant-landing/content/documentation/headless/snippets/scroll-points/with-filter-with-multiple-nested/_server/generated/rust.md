```rust
use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

client
    .scroll(
        ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([
            Condition::matches("diet[].food", "meat".to_string()),
            Condition::matches("diet[].likes", true),
        ])),
    )
    .await?;
```
