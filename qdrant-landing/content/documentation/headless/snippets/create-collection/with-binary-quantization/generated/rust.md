```rust
use qdrant_client::qdrant::{
    BinaryQuantizationBuilder, CreateCollectionBuilder, Distance, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
            .quantization_config(BinaryQuantizationBuilder::new(true)),
    )
    .await?;
```
