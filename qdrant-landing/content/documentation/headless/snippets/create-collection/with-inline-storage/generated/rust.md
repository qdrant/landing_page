```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, HnswConfigDiffBuilder, Memory,
    TurboQuantBitSize, TurboQuantizationBuilder, VectorParamsBuilder,
};

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).memory(Memory::Cold).datatype(Datatype::Turbo4))
            .quantization_config(TurboQuantizationBuilder::default().memory(Memory::Cold).bits(TurboQuantBitSize::Bits1))
            .hnsw_config(
                HnswConfigDiffBuilder::default()
                    .memory(Memory::Cold)
                    .inline_storage(true),
            ),
    )
    .await?;
```
