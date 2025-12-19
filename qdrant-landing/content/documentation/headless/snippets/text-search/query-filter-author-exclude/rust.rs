use qdrant_client::qdrant::{Condition, Document, Filter, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let filter = Filter::must_not([Condition::matches("author", "H.G. Wells".to_string())]);

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_nearest(Document {
                    text: "time travel".into(),
                    model: "sentence-transformers/all-minilm-l6-v2".into(),
                    ..Default::default()
                }))
                .using("description-dense")
                .filter(filter)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
}
