use qdrant_client::qdrant::CreateAliasBuilder;

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .create_alias(CreateAliasBuilder::new(
            "example_collection",
            "production_collection",
        ))
        .await?;

    Ok(())
}
