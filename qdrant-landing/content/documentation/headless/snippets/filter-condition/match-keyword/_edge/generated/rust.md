```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "color".try_into().unwrap(),
    Match::new_value(ValueVariants::String("red".to_string())),
));
```
