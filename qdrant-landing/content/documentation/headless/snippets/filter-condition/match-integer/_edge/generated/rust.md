```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "count".try_into().unwrap(),
    Match::new_value(ValueVariants::Integer(0)),
));
```
