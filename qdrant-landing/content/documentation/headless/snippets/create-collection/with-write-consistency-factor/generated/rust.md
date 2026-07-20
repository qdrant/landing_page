```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(300, Distance::Cosine))
            .shard_number(6)
            .replication_factor(2)
            .write_consistency_factor(2),
    )
    .await?;
```
