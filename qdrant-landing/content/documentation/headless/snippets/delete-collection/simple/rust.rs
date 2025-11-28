

pub async fn main() -> anyhow::Result<()> {
    client.delete_collection("{collection_name}").await?;

    Ok(())
}
