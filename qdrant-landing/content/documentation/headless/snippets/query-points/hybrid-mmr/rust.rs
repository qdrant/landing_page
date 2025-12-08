use qdrant_client::Qdrant;
use qdrant_client::qdrant::{MmrBuilder, Query, QueryPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    client.query(
        QueryPointsBuilder::new("{collection_name}")
            .query(Query::new_nearest_with_mmr(
                vec![0.01, 0.45, 0.67], // search vector
                MmrBuilder::new()
                    .diversity(0.5) // 0.0 - relevance; 1.0 - diversity
                    .candidates_limit(100) // num of candidates to preselect
            ))
            .limit(10)
    ).await?;

    Ok(())
}
