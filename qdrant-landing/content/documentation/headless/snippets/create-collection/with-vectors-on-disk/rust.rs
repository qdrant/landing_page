use qdrant_client::qdrant::{CreateCollectionBuilder, Distance, VectorParamsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}")
                .vectors_config(VectorParamsBuilder::new(768, Distance::Cosine).on_disk(true)),
        )
        .await?;

    Ok(())
}
