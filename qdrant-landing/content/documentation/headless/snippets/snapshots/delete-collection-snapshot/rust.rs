use qdrant_client::qdrant::DeleteSnapshotRequestBuilder;
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .delete_snapshot(DeleteSnapshotRequestBuilder::new(
            "{collection_name}",
            "{snapshot_name}",
        ))
        .await?;

    Ok(())
}
