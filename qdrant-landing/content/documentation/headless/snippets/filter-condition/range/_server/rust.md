```rust
use qdrant_client::qdrant::{Condition, Range};

Condition::range(
    "price",
    Range {
        gt: None,
        gte: Some(100.0),
        lt: None,
        lte: Some(450.0),
    },
)
```
