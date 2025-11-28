use qdrant_client::qdrant::{DeletePayloadPointsBuilder, PointsIdsList};

pub async fn main() -> anyhow::Result<()> {
    client
        .delete_payload(
            DeletePayloadPointsBuilder::new(
                "{collection_name}",
                vec!["color".to_string(), "price".to_string()],
            )
            .points_selector(PointsIdsList {
                ids: vec![0.into(), 3.into(), 10.into()],
            })
            .wait(true),
        )
        .await?;

    Ok(())
}
