```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, Memory, VectorParamsBuilder};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).memory(Memory::Cold)),
    )
    .await?;
```
