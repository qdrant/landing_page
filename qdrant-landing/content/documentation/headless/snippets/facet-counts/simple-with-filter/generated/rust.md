```rust
use qdrant_client::qdrant::{Condition, FacetCountsBuilder, Filter};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .facet(
         FacetCountsBuilder::new("{collection_name}", "size")
             .limit(10)
             .filter(Filter::must(vec![Condition::matches(
                 "color",
                 "red".to_string(),
             )])),
     )
     .await?;
```
