use qdrant_client::qdrant::{Condition, CountPointsBuilder, Filter};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .count(
            CountPointsBuilder::new("{collection_name}")
                .filter(Filter::must([Condition::matches(
                    "color",
                    "red".to_string(),
                )]))
                .exact(true),
        )
        .await?;

    Ok(())
}
