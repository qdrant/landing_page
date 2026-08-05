```rust
use qdrant_client::qdrant::{
    CompressionRatio, CreateCollectionBuilder, Distance, Memory, ProductQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine))
            .quantization_config(
                ProductQuantizationBuilder::new(CompressionRatio::X16.into())
                    .memory(Memory::Pinned),
            ),
    )
    .await?;
```
