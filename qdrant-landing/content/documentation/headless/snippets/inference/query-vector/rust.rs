use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Query, QueryPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(Query::new_nearest(vec![0.12, 0.34, 0.56, 0.78]))
        )
        .await?;

    Ok(())
}
