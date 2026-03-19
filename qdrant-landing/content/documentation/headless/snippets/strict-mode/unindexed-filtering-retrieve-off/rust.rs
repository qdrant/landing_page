use qdrant_client::qdrant::{UpdateCollectionBuilder, StrictModeConfigBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .update_collection(
            UpdateCollectionBuilder::new("{collection_name}")
                .strict_mode_config(
                    StrictModeConfigBuilder::default()
                        .enabled(true)
                        .unindexed_filtering_retrieve(true),
                ),
        )
        .await?;

    Ok(())
}
