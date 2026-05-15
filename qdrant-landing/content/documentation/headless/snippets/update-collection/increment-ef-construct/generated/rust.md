```rust
use qdrant_client::qdrant::{HnswConfigDiffBuilder, UpdateCollectionBuilder};

let base_ef = client
  .collection_info("{collection_name}")              
  .await?                                                                                                                                                   
  .result                                            
  .and_then(|info| info.config)
  .and_then(|config| config.hnsw_config)                                                                                                                    
  .and_then(|hnsw| hnsw.ef_construct);

client
    .update_collection(
        UpdateCollectionBuilder::new("{collection_name}")
            .hnsw_config(HnswConfigDiffBuilder::default().ef_construct(base_ef.unwrap_or(100) + 1)),
    )
    .await?;
```
