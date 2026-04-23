use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .with_header("x-request-id", "my-trace-id")
        .list_collections()
        .await?;

    Ok(())
}
