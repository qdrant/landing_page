```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_datetime_range(
    "date".try_into().unwrap(),
    Range {
        gt: Some("2023-02-08T10:49:00Z".parse()?),
        gte: None,
        lt: None,
        lte: Some("2024-01-31T10:14:31Z".parse()?),
    },
));
```
