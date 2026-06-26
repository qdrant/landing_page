```rust
use qdrant_edge::bm25_embed::*;

let bm25 = EdgeBm25::new(EdgeBm25Config {
    language: Some("english".to_string()),
    ..Default::default()
})?;
```
