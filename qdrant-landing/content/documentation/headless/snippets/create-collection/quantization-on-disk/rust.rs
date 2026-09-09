use qdrant_client::qdrant::{
    CreateCollectionBuilder, Distance, Memory, QuantizationType, ScalarQuantizationBuilder,
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
                .vectors_config(
                    VectorParamsBuilder::new(768, Distance::Cosine).memory(Memory::Cold),
                )
                .quantization_config(
                    ScalarQuantizationBuilder::default()
                        .r#type(QuantizationType::Int8.into())
                        .memory(Memory::Cold),
                ),
        )
        .await?;

    Ok(())
}
