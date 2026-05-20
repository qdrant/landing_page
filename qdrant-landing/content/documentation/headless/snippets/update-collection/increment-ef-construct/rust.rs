use qdrant_client::qdrant::{HnswConfigDiffBuilder, UpdateCollectionBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    // @block-start get-current-value
    let base_ef = client
      .collection_info("{collection_name}")              
      .await?                                                                                                                                                   
      .result                                            
      .and_then(|info| info.config)
      .and_then(|config| config.hnsw_config)                                                                                                                    
      .and_then(|hnsw| hnsw.ef_construct);
    // @block-end get-current-value

    // @block-start update-collection
    client
        .update_collection(
            UpdateCollectionBuilder::new("{collection_name}")
                .hnsw_config(HnswConfigDiffBuilder::default().ef_construct(base_ef.unwrap_or(100) + 1)),
        )
        .await?;
    // @block-end update-collection

    Ok(())
}
