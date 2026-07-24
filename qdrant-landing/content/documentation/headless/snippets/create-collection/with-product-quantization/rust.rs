use qdrant_client::qdrant::{
    CompressionRatio, CreateCollectionBuilder, Distance, Memory, ProductQuantizationBuilder,
    VectorParamsBuilder,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

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

    Ok(())
}
