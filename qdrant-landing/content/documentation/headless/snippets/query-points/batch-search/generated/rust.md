```rust
use qdrant_client::qdrant::{Condition, Filter, QueryBatchPointsBuilder, QueryPointsBuilder};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

let filter = Filter::must([Condition::matches("city", "London".to_string())]);

let searches = vec![
    QueryPointsBuilder::new("{collection_name}")
        .query(vec![0.1, 0.2, 0.3, 0.4])
        .limit(3)
        .filter(filter.clone())
        .build(),
    QueryPointsBuilder::new("{collection_name}")
        .query(vec![0.5, 0.3, 0.2, 0.3])
        .limit(3)
        .filter(filter)
        .build(),
];

client
        .query_batch(QueryBatchPointsBuilder::new("{collection_name}", searches))
        .await?;
```
