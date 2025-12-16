```rust
use qdrant_client::qdrant::{start_from::Value, Direction, OrderByBuilder};

OrderByBuilder::new("timestamp")
    .direction(Direction::Desc.into())
    .start_from(Value::Integer(123))
    .build();
```
