use qdrant_client::qdrant::{OrderByBuilder, ScrollPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .scroll(
            ScrollPointsBuilder::new("{collection_name}")
                .limit(15)
                .order_by(OrderByBuilder::new("timestamp")),
        )
        .await?;

    Ok(())
}
