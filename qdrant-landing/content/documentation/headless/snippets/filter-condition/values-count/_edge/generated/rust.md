```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_values_count(
    "comments".try_into().unwrap(),
    ValuesCount {
        gt: Some(2),
        gte: None,
        lt: None,
        lte: None,
    },
));
```
