use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder},
};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?; // @hide

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(Query::new_nearest(Document {
                    text: "My Query Text".into(),
                    model: "<the-model-to-use>".into(),
                    ..Default::default()
                }))
                .build(),
        )
        .await?;

    Ok(())
}
