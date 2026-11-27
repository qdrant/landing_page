use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("https://xyz-example.qdrant.io:6334").api_key("<your-api-key>").build()?; // @hide

    client
        .create_collection(
            CreateCollectionBuilder::new("venues")
                .vectors_config(VectorParamsBuilder::new(384, Distance::Cosine)),
        )
        .await?;

    Ok(())
}
