use qdrant_client::qdrant::FacetCountsBuilder;

pub async fn main() -> anyhow::Result<()> {
    client
        .facet(
             FacetCountsBuilder::new("{collection_name}", "size")
                 .limit(10)
                 .exact(true),
         )
         .await?;

    Ok(())
}
