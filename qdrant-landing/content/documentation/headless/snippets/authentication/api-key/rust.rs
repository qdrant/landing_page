use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io:6334")
        .api_key("your_api_key_here")
        .build()?;

    Ok(())
}
