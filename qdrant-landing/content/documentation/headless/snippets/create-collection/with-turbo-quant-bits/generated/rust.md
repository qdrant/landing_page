```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, Memory, TurboQuantBitSize, TurboQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
            .quantization_config(
                TurboQuantizationBuilder::new()
                    .memory(Memory::Pinned)
                    .bits(TurboQuantBitSize::Bits2),
            ),
    )
    .await?;
```
