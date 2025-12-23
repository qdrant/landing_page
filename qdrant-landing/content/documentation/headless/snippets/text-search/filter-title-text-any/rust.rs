use qdrant_client::qdrant::{Condition, Document, Filter, Query, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let filter = Filter::must([Condition::matches("title", "space war".to_string())]);

    client
        .query(
            QueryPointsBuilder::new("books")
                .query(Query::new_nearest(Document::new(
                    "space opera",
                    "sentence-transformers/all-minilm-l6-v2",
                )))
                .using("description-dense")
                .filter(filter)
                .with_payload(true)
                .build(),
        )
        .await?;

    Ok(())
}
