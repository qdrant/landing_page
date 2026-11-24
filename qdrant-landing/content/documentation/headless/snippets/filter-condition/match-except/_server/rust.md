```rust
use qdrant_client::qdrant::r#match::MatchValue;

Condition::matches(
    "color",
    !MatchValue::from(vec!["black".to_string(), "yellow".to_string()]),
)
```
