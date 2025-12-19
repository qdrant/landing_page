use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateCollectionBuilder, StrictModeConfigBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}")
                .strict_mode_config(StrictModeConfigBuilder::default().enabled(true).unindexed_filtering_retrieve(false)),
        )
        .await?;

    Ok(())
}
