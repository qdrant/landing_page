use qdrant_client::qdrant::{Document, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> { // @hide
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_nearest(Document {
                    text: "time travel".into(),
                    model: "prithivida/splade_pp_en_v1".into(),
                    ..Default::default()
                }))
                .using("title-splade")
                .limit(10)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
} // @hide
