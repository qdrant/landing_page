```rust
use qdrant_client::qdrant::{Condition, Filter, SearchMatrixPointsBuilder};

client
    .search_matrix_pairs(
        SearchMatrixPointsBuilder::new("collection_name")
           .filter(Filter::must(vec![Condition::matches(
               "color",
               "red".to_string(),
           )]))
           .sample(10)
           .limit(2),
    )
    .await?;
```
