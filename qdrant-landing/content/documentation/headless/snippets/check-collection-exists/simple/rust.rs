

pub async fn main() -> anyhow::Result<()> {
    client.collection_exists("{collection_name}").await?;

    Ok(())
}
