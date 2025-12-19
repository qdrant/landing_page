use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .upsert_points(
            UpsertPointsBuilder::new(
                "{collection_name}",
                vec![PointStruct::new(
                    1,
                    vec![0.9, 0.1, 0.1],
                    [("color", "Red".into())],
                )],
            )
            .wait(true),
        )
        .await?;

    Ok(())
}
