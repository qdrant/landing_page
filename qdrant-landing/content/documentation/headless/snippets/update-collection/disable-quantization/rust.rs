use qdrant_client::qdrant::{Disabled, UpdateCollectionBuilder};

pub async fn main() -> anyhow::Result<()> {
    client
        .update_collection(UpdateCollectionBuilder::new("{collection_name}").quantization_config(Disabled {}))
        .await?;

    Ok(())
}
