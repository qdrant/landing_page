```rust
use qdrant_client::qdrant::{UpdateCollectionBuilder, StrictModeConfigBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .strict_mode_config(
                StrictModeConfigBuilder::default()
                    .enabled(true)
                    .unindexed_filtering_retrieve(true),
            ),
    )
    .await?;
```
