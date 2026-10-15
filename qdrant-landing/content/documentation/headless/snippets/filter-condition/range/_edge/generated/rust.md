```rust
use ordered_float::OrderedFloat;
use qdrant_edge::*;

Condition::Field(FieldCondition::new_range(
    "price".try_into().unwrap(),
    Range {
        gt: None,
        gte: Some(OrderedFloat(100.0)),
        lt: None,
        lte: Some(OrderedFloat(450.0)),
    },
));
```
