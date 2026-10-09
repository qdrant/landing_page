```rust
use qdrant_client::qdrant::{Condition, ValuesCount};

Condition::values_count(
    "comments",
    ValuesCount {
        gt: Some(2),
        ..Default::default()
    },
)
```
