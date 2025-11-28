use qdrant_client::qdrant::{OrderByBuilder, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}")
                .limit(15)
                .order_by(OrderByBuilder::new("timestamp")),
        )
        .await?;

    Ok(())
}
