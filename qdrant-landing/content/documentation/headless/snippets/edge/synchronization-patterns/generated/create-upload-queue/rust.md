```rust
use std::collections::*;

// This is an in-memory queue.
// For production use cases consider persisting changes.
let mut upload_queue: VecDeque<::qdrant_client::qdrant::PointStruct> = VecDeque::new();
```
