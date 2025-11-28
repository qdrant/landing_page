use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}").filter(Filter::should([
                Condition::matches("country.name", "Germany".to_string()),
            ])),
        )
        .await?;

    Ok(())
}
