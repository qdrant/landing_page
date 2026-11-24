use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};
use qdrant_client::Qdrant;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}")
                .filter(Filter::must([Condition::slice(3, 8)])),
        )
        .await?;

    Ok(())
}
