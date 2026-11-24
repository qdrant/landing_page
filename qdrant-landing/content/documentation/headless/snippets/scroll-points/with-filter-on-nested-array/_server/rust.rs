use qdrant_client::qdrant::{Condition, Filter, Range, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

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
