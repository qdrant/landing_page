```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "color".try_into().unwrap(),
    vec!["black".to_string(), "yellow".to_string()].into(),
));
```
