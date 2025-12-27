use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_nearest(Document::new(
                    "time travel",
                    "prithivida/splade_pp_en_v1",
                )))
                .using("title-splade")
                .limit(10)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
}
