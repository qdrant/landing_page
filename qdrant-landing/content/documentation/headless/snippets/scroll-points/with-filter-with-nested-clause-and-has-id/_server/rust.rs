use qdrant_client::qdrant::{Condition, Filter, NestedCondition, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([
                NestedCondition {
                    key: "diet".to_string(),
                    filter: Some(Filter::must([
                        Condition::matches("food", "meat".to_string()),
                        Condition::matches("likes", true),
                    ])),
                }
                .into(),
                Condition::has_id([1]),
            ])),
        )
        .await?;

    Ok(())
}
