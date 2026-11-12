```rust
use qdrant_client::qdrant::{OptimizersConfigDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}").optimizers_config(
            OptimizersConfigDiffBuilder::default()
                .default_segment_number(4)
                .max_segment_size(1000000u64),
        ),
    )
    .await?;
```
