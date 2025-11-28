use qdrant_client::qdrant::{Condition, Filter, Range, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}").filter(Filter::should([
                Condition::range(
                    "country.cities[].population",
                    Range {
                        gte: Some(9.0),
                        ..Default::default()
                    },
                ),
            ])),
        )
        .await?;

    Ok(())
}
