use qdrant_client::qdrant::DeleteVectorNameRequestBuilder;
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    // @hide-start
    let client = Qdrant::from_url("http://localhost:6334").build()?;
    // @hide-end

    client
        .delete_vector_name(DeleteVectorNameRequestBuilder::new(
            "{collection_name}",
            "{vector_name}",
        ))
        .await?;

    Ok(())
}
