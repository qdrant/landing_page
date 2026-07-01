use qdrant_client::qdrant::{CollectionParamsDiffBuilder, UpdateCollectionBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .update_collection(
            UpdateCollectionBuilder::new("{collection_name}")
                .params(CollectionParamsDiffBuilder::default().read_fan_out_delay_ms(100u64)),
        )
        .await?;

    Ok(())
}
