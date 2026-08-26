```rust
use qdrant_client::qdrant::{
    BinaryQuantizationBuilder,
    CreateCollectionBuilder,
    Distance,
    Memory,
    VectorParamsBuilder,
    BinaryQuantizationEncoding,
};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
            .quantization_config(BinaryQuantizationBuilder::default()
                .memory(Memory::Pinned)
                .encoding(BinaryQuantizationEncoding::TwoBits)
            ),
    )
    .await?;
```
