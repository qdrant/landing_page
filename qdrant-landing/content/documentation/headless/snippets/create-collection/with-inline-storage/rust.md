```rust
use qdrant_client::qdrant::{
    BinaryQuantizationBuilder, CreateCollectionBuilder, Distance, HnswConfigDiffBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;

client
    .create_collection(
        CreateCollectionBuilder::new("{collection_name}")
            .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).on_disk(true))
            .quantization_config(BinaryQuantizationBuilder::new(false))
            .hnsw_config(
                HnswConfigDiffBuilder::default()
                    .on_disk(true)
                    .inline_storage(true),
            ),
    )
    .await?;
