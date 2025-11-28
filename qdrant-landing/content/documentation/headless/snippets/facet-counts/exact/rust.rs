use qdrant_client::qdrant::FacetCountsBuilder;

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .facet(
             FacetCountsBuilder::new("{collection_name}", "size")
                 .limit(10)
                 .exact(true),
         )
         .await?;

    Ok(())
}
