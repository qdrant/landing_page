```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "description".try_into().unwrap(),
    Match::new_text("good cheap"),
));
```
