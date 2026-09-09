use qdrant_client::qdrant::{
    BinaryQuantizationBuilder,
    CreateCollectionBuilder,
    Distance,
    Memory,
    VectorParamsBuilder,
    BinaryQuantizationQueryEncoding,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}")
                .vectors_config(VectorParamsBuilder::new(1536, Distance::Cosine))
                .quantization_config(
                    BinaryQuantizationBuilder::default()
                        .memory(Memory::Pinned)
                        .query_encoding(BinaryQuantizationQueryEncoding::scalar8bits())
                ),
        )
        .await?;

    Ok(())
}
