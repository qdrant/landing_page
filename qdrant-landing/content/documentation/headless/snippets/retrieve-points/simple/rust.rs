use qdrant_client::qdrant::GetPointsBuilder;

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .get_points(GetPointsBuilder::new(
            "{collection_name}",
            vec![0.into(), 30.into(), 100.into()],
        ))
        .await?;

    Ok(())
}
