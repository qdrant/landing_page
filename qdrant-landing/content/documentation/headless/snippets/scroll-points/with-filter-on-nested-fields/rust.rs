use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}").filter(Filter::should([
                Condition::matches("country.name", "Germany".to_string()),
            ])),
        )
        .await?;

    Ok(())
}
