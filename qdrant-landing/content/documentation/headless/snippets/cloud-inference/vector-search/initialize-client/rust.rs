use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6334")
        .api_key("<paste-your-api-key-here>")
        .build()
        .unwrap();

    _ = client; // @hide

    Ok(())
}
