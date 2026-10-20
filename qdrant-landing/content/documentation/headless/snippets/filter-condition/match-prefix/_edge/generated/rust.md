```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "url".try_into().unwrap(),
    Match::new_prefix("https://qdrant."),
));
```
