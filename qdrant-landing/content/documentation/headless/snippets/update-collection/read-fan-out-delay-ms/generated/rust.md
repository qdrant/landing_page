```rust
use qdrant_client::qdrant::{CollectionParamsDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .params(CollectionParamsDiffBuilder::default().read_fan_out_delay_ms(100u64)),
    )
    .await?;
```
