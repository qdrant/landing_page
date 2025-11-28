use qdrant_client::qdrant::{Disabled, UpdateCollectionBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .update_collection(UpdateCollectionBuilder::new("{collection_name}").quantization_config(Disabled {}))
        .await?;

    Ok(())
}
