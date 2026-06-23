```rust
use qdrant_client::qdrant::{HnswConfigDiffBuilder, UpdateCollectionBuilder};

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .hnsw_config(HnswConfigDiffBuilder::default().max_indexing_threads(4)),
    )
    .await?;
```
