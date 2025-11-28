

pub async fn main() -> anyhow::Result<()> {
    client.delete_alias("production_collection").await?;

    Ok(())
}
