use qdrant_client::qdrant::{OptimizersConfigDiffBuilder, UpdateCollectionBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .update_collection(
            UpdateCollectionBuilder::new("{collection_name}")
                .optimizers_config(OptimizersConfigDiffBuilder::default()),
        )
        .await?;

    Ok(())
}
