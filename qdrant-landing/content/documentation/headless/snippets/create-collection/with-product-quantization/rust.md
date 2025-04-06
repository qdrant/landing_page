```rust
use qdrant_client::qdrant::{
    CompressionRatio, CreateCollectionBuilder, Distance, ProductQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .quantization_config(
                ProductQuantizationBuilder::new(CompressionRatio::X16.into()).always_ram(true),
            ),
    )
    .await?;
```
