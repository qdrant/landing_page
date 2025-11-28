use qdrant_client::qdrant::{with_payload_selector::SelectorOptions, QueryPointsBuilder};

pub async fn main() -> anyhow::Result<()> {
    let client = qdrant_client::Qdrant::from_url("http://localhost:6334").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(vec![0.2, 0.1, 0.9, 0.7])
                .limit(3)
                .with_payload(SelectorOptions::Include(
                    vec![
                        "city".to_string(),
                        "village".to_string(),
                        "town".to_string(),
                    ]
                    .into(),
                ))
                .with_vectors(true),
        )
        .await?;

    Ok(())
}
