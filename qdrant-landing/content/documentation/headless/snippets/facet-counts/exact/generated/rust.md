```rust
use qdrant_client::qdrant::FacetCountsBuilder;

client
    .facet(
         FacetCountsBuilder::new("{collection_name}", "size")
             .limit(10)
             .exact(true),
     )
     .await?;
```
