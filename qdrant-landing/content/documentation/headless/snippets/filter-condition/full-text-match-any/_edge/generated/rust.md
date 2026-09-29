```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "description".try_into().unwrap(),
    Match::TextAny(MatchTextAny {
        text_any: "good cheap".to_string(),
    }),
));
```
