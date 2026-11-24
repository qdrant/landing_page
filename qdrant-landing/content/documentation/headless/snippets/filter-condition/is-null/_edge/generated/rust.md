```rust
use qdrant_edge::*;

Condition::IsNull(IsNullCondition::from(
    "reports".parse::<JsonPath>().unwrap(),
));
```
