use qdrant_client::qdrant::{Condition, DeletePayloadPointsBuilder, Filter};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .delete_payload(
            DeletePayloadPointsBuilder::new(
                "{collection_name}",
                vec!["color".to_string(), "price".to_string()],
            )
            .points_selector(Filter::must([Condition::matches(
                "color",
                "red".to_string(),
            )]))
            .wait(true),
        )
        .await?;

    Ok(())
}
