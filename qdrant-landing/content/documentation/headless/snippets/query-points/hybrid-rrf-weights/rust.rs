use qdrant_client::qdrant::{Query, QueryPointsBuilder, RrfBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                // .add_prefetch(...)  <┐
                // .add_prefetch(...)  <┴─ 2+ prefetches here
                .query(Query::new_rrf(RrfBuilder::new().weights(vec![3.0, 1.0]))),
        )
        .await?;

    Ok(())
}
