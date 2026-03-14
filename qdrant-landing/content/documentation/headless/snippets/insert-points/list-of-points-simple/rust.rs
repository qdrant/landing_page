use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .upsert_points(
            UpsertPointsBuilder::new(
                "{collection_name}",
                vec![
                    PointStruct::new(1, vec![0.9, 0.1, 0.1], [("color", "red".into())]),
                    PointStruct::new(2, vec![0.1, 0.9, 0.1], [("color", "green".into())]),
                    PointStruct::new(3, vec![0.1, 0.1, 0.9], [("color", "blue".into())]),
                ],
            )
            .wait(true),
        )
        .await?;

    Ok(())
}
