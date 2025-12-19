use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder, Sample};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?;

    let sampled = client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(Query::new_sample(Sample::Random))
        )
        .await?;

    _ = sampled; // @hide
    Ok(())
}
