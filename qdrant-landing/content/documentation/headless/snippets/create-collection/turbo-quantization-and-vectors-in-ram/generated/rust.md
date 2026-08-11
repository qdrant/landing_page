```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, Memory, TurboQuantBitSize,
    TurboQuantizationBuilder, VectorParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).datatype(Datatype::Turbo4))
            .quantization_config(
                TurboQuantizationBuilder::default()
                    .bits(TurboQuantBitSize::Bits1)
                    .memory(Memory::Pinned),
            ),
    )
    .await?;
```
