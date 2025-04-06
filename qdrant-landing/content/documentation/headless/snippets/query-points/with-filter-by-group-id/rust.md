```rust
use qdrant_client::qdrant::{Condition, Filter, QueryPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .query(
        QueryPointsBuilder::new("{collection_name}")
            .query(vec![0.1, 0.1, 0.9])
            .limit(10)
            .filter(Filter::must([Condition::matches(
                "group_id",
                "user_1".to_string(),
            )])),
    )
    .await?;
```
