use qdrant_client::qdrant::{DeletePointsBuilder, PointsIdsList};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .delete_points(
            DeletePointsBuilder::new("{collection_name}")
                .points(PointsIdsList {
                    ids: vec![0.into(), 3.into(), 100.into()],
                })
                .wait(true),
        )
        .await?;

    Ok(())
}
