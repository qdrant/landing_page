```rust
// This is an in-memory queue.
// For production use cases consider persisting changes.
let mut upload_queue: std::collections::VecDeque<PointStruct> =
    std::collections::VecDeque::new();
```
