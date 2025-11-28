use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}").filter(Filter::must([
                Condition::matches("diet[].food", "meat".to_string()),
                Condition::matches("diet[].likes", true),
            ])),
        )
        .await?;

    Ok(())
}
