use qdrant_client::qdrant::{
    CreateVectorNameRequestBuilder, DenseVectorCreationConfigBuilder, Distance,
};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .create_vector_name(
            CreateVectorNameRequestBuilder::new(
                "{collection_name}",
                "{vector_name}",
                DenseVectorCreationConfigBuilder::new(256, Distance::Cosine),
            ),
        )
        .await?;

    Ok(())
}
