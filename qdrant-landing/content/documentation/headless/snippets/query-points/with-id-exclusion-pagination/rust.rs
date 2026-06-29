use qdrant_client::qdrant::{Condition, Filter, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let seen_ids = vec![83461u64, 19284, 57392, 44017, 91825]; // IDs returned on previous pages

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(vec![0.2, 0.1, 0.9, 0.7])
                .filter(Filter::must_not([Condition::has_id(seen_ids)]))
                .limit(5),
        )
        .await?;

    Ok(())
}
