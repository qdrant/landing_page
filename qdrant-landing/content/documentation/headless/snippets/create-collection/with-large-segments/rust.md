```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, OptimizersConfigDiffBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .optimizers_config(
                OptimizersConfigDiffBuilder::default().default_segment_number(2).max_segment_size(5000000),
            ),
    )
    .await?;
```
