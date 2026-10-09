```rust
use qdrant_edge::*;

edge_shard.scroll(
    ScrollRequestBuilder::new()
        .filter(Filter::new_must(Condition::Slice(SliceCondition {
            slice: Slice {
                total: std::num::NonZeroU32::try_from(8)?,
                index: 3,
            },
        })))
        .build(),
)?;
```
