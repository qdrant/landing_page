use qdrant_client::qdrant::{Condition, Filter, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}").filter(Filter {
                must: vec![Condition::matches("city", "London".to_string())],
                must_not: vec![Condition::matches("color", "red".to_string())],
                ..Default::default()
            }),
        )
        .await?;

    Ok(())
}
