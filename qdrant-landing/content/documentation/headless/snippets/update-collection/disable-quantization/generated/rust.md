```rust
use qdrant_client::qdrant::{Disabled, UpdateCollectionBuilder};

client
    .update_collection(UpdateCollectionBuilder::new("{collection_name}").quantization_config(Disabled {}))
    .await?;
```
