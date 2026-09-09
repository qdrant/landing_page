```rust
use qdrant_edge::*;

let facet_response = edge_shard.facet(
    FacetRequestBuilder::new("color".try_into().unwrap())
        .limit(10)
        .build(),
)?;
```
