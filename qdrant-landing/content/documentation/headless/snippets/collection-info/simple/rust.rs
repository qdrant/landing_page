

pub async fn main() -> anyhow::Result<()> {
    client.collection_info("{collection_name}").await?;

    Ok(())
}
