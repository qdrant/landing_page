```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, HnswConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .hnsw_config(HnswConfigDiffBuilder::default().payload_m(16).m(0)),
    )
    .await?;
```
