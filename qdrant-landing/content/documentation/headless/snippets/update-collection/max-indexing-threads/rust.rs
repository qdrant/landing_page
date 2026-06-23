use qdrant_client::qdrant::{HnswConfigDiffBuilder, UpdateCollectionBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .update_collection(
            UpdateCollectionBuilder::new("{collection_name}")
                .hnsw_config(HnswConfigDiffBuilder::default().max_indexing_threads(4)),
        )
        .await?;

    Ok(())
}
