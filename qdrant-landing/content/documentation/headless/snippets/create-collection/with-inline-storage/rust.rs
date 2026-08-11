use qdrant_client::Qdrant;
use qdrant_client::qdrant::{
    CreateCollectionBuilder, Datatype, Distance, HnswConfigDiffBuilder, Memory,
    TurboQuantBitSize, TurboQuantizationBuilder, VectorParamsBuilder,
};

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

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

    Ok(())
}
