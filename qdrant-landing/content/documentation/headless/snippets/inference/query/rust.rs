use qdrant_client::{
    Qdrant,
    qdrant::{Document, Query, QueryPointsBuilder},
};

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build().unwrap();

    client
        .query(
            QueryPointsBuilder::new("{collection_name}")
                .query(Query::new_nearest(Document {
                    text: "How to bake cookies?".into(),
                    model: "qdrant/bm25".into(),
                    ..Default::default()
                }))
                .using("my-bm25-vector")
                .build(),
        )
        .await?;

    Ok(())
}
