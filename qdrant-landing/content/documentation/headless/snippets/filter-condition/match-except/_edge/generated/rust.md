```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "color".try_into().unwrap(),
    Match::Except(vec!["black".to_string(), "yellow".to_string()].into()),
));
```
