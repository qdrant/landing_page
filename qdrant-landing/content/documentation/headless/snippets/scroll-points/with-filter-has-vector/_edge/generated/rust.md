```rust
use qdrant_edge::*;

edge_shard.scroll(
    ScrollRequestBuilder::new()
        .filter(Filter::new_must(Condition::HasVector(
            HasVectorCondition::from("image".to_string()),
        )))
        .build(),
)?;
```
