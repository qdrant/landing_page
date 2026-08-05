```rust
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, Memory, QuantizationType, ScalarQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(
                VectorParamsBuilder::new(768, Distance::Cosine).memory(Memory::Cold),
            )
            .quantization_config(
                ScalarQuantizationBuilder::default()
                    .r#type(QuantizationType::Int8.into())
                    .memory(Memory::Pinned),
            ),
    )
    .await?;
```
