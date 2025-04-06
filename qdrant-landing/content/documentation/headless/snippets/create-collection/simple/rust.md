```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateCollectionBuilder, VectorParamsBuilder};

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(100, Distance::Cosine)),
    )
    .await?;
```
