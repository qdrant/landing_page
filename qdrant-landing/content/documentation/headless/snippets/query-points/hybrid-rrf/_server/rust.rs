use qdrant_client::Qdrant;
use qdrant_client::qdrant::{PrefetchQueryBuilder, Query, QueryPointsBuilder, RrfBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client.query(
        QueryPointsBuilder::new("{collection_name}")
            .add_prefetch(PrefetchQueryBuilder::default()
                .query(Query::new_text("time travel"))
                .using("title")
                .limit(20u64)
            )
            .add_prefetch(PrefetchQueryBuilder::default()
                .query(Query::new_nearest(vec![0.01, 0.45, 0.67]))
                .using("dense")
                .limit(20u64)
            )
            .query(Query::new_rrf(RrfBuilder::default()))
            .limit(10u64)
    ).await?;

    Ok(())
}
