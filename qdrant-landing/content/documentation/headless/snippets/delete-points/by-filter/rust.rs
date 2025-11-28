use qdrant_client::qdrant::{Condition, DeletePointsBuilder, Filter};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .delete_points(
            DeletePointsBuilder::new("{collection_name}")
                .points(Filter::must([Condition::matches(
                    "color",
                    "red".to_string(),
                )]))
                .wait(true),
        )
        .await?;

    Ok(())
}
