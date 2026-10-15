```rust
use qdrant_edge::*;

Condition::IsEmpty(IsEmptyCondition::from(
    "reports".parse::<JsonPath>().unwrap(),
));
```
