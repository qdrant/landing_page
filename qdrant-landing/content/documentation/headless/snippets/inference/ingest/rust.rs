use qdrant_client::{
    Payload, Qdrant,
    qdrant::{DocumentBuilder, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?;

    client
        .upsert_points(UpsertPointsBuilder::new(
            "{collection_name}",
            vec![PointStruct::new(
                1,
                HashMap::from([(
                    "my-bm25-vector".to_string(),
                    DocumentBuilder::new("Recipe for baking chocolate chip cookies", "qdrant/bm25")
                        .build(),
                )]),
                Payload::default(),
            )],
        ))
        .await?;

    Ok(())
}
