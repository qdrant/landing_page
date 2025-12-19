use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client.create_snapshot("{collection_name}").await?;

    Ok(())
}
