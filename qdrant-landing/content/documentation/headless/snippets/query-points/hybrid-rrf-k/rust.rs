use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Rrf, PrefetchQueryBuilder, Query, QueryPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client.query(
        QueryPointsBuilder::new("{collection_name}")
            // .add_prefetch(...)  <┐
            // .add_prefetch(...)  <┴─ 2+ prefetches here
            .query(Query::new_rrf(RrfBuilder::with_k(60))
    ).await?;

    Ok(())
}
