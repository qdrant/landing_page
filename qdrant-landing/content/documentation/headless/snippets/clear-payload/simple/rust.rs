use qdrant_client::qdrant::{ClearPayloadPointsBuilder, PointsIdsList};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .clear_payload(
            ClearPayloadPointsBuilder::new("{collection_name}")
                .points(PointsIdsList {
                    ids: vec![0.into(), 3.into(), 10.into()],
                })
                .wait(true),
        )
        .await?;

    Ok(())
}
