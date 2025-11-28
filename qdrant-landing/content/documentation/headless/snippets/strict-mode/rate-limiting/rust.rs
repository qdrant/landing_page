use qdrant_client::Qdrant;
use qdrant_client::qdrant::{CreateCollectionBuilder, StrictModeConfigBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .create_collection(
            CreateCollectionBuilder::new("{collection_name}")
                .strict_config_mode(StrictModeConfigBuilder::default().enabled(true).read_rate_limit(1000).write_rate_limit(100)),
        )
        .await?;

    Ok(())
}
