```rust
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    BinaryQuantizationBuilder, CreateCollectionBuilder, Distance, HnswConfigDiffBuilder, Memory,
    VectorParamsBuilder,
};

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).memory(Memory::Cold))
            .quantization_config(BinaryQuantizationBuilder::default().memory(Memory::Cold))
            .hnsw_config(
                HnswConfigDiffBuilder::default()
                    .memory(Memory::Cold)
                    .inline_storage(true),
            ),
    )
    .await?;
```
