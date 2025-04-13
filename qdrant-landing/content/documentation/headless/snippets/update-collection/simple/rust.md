```rust
use qdrant_client::qdrant::{OptimizersConfigDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}").optimizers_config(
            OptimizersConfigDiffBuilder::default().indexing_threshold(10000),
        ),
    )
    .await?;
```
