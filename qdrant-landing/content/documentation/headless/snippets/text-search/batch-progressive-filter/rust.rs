use qdrant_client::qdrant::{Condition, DocumentBuilder, Filter, Query, QueryBatchPointsBuilder, QueryPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    let strict_filter = Filter::must([Condition::matches("title", "time travel".to_string())]);
    let relaxed_filter = Filter::must([Condition::matches("title", "time travel".to_string())]);

    let searches = vec![
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("time travel", "sentence-transformers/all-minilm-l6-v2")
                    .build(),
            ))
            .using("description-dense")
            .filter(strict_filter)
            .with_payload(true)
            .build(),
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("time travel", "sentence-transformers/all-minilm-l6-v2")
                    .build(),
            ))
            .using("description-dense")
            .filter(relaxed_filter)
            .with_payload(true)
            .build(),
        QueryPointsBuilder::new("books")
            .query(Query::new_nearest(
                DocumentBuilder::new("time travel", "sentence-transformers/all-minilm-l6-v2")
                    .build(),
            ))
            .using("description-dense")
            .with_payload(true)
            .build(),
    ];

    client
        .query_batch(QueryBatchPointsBuilder::new("books", searches))
        .await?;

    Ok(())
}
