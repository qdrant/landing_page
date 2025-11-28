use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}")
                .filter(Filter::must([Condition::matches(
                    "color",
                    "red".to_string(),
                )]))
                .limit(1)
                .with_payload(true)
                .with_vectors(false),
        )
        .await?;

    Ok(())
}
