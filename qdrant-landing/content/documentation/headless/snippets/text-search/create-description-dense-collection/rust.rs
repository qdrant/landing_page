use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder, VectorsConfigBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> { // @hide
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let mut vectors_config = VectorsConfigBuilder::default();
    vectors_config.add_named_vector_params("description-dense", VectorParamsBuilder::new(384, Distance::Cosine));

    client
        .create_collection(
            CreateCollectionBuilder::new("books").vectors_config(vectors_config),
        )
        .await?;

    Ok(())
} // @hide
