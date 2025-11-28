use qdrant_client::qdrant::CreateAliasBuilder;

pub async fn main() -> anyhow::Result<()> {
    client
        .create_alias(CreateAliasBuilder::new(
            "example_collection",
            "production_collection",
        ))
        .await?;

    Ok(())
}
