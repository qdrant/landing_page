```rust
use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("items")
            .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine)),
    )
    .await?;
```
