```rust
use qdrant_edge::*;

Condition::Field(FieldCondition::new_match(
    "description".try_into().unwrap(),
    Match::Phrase(MatchPhrase {
        phrase: "brown fox".to_string(),
    }),
));
```
