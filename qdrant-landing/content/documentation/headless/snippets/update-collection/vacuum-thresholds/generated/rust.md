```rust
use qdrant_client::qdrant::{OptimizersConfigDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}").optimizers_config(
            OptimizersConfigDiffBuilder::default()
                .deleted_threshold(0.2)
                .vacuum_min_vector_number(1000),
        ),
    )
    .await?;
```
