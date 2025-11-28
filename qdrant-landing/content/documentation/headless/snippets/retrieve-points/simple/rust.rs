use qdrant_client::qdrant::GetPointsBuilder;

pub async fn main() -> anyhow::Result<()> {
    client
        .get_points(GetPointsBuilder::new(
            "{collection_name}",
            vec![0.into(), 30.into(), 100.into()],
        ))
        .await?;

    Ok(())
}
