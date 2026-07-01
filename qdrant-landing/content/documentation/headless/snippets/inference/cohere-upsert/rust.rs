use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Image, PointStruct, UpsertPointsBuilder},
};
use std::collections::HashMap;

pub async fn main() -> anyhow::Result<()> {
    let client = Qdrant::from_url("<your-qdrant-url>").build()?; // @hide
    let mut options = HashMap::new();
    options.insert("output_dimension".to_string(), 512.into());

    client
        .with_header("cohere-api-key", "<YOUR_COHERE_API_KEY>")
        .upsert_points(UpsertPointsBuilder::new("{collection_name}",
            vec![
                PointStruct::new(1,
                    Image {
                      image: Some("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjmAAAAAElFTkSuQmCC".into()),
                      model: "cohere/embed-v4.0".into(),
                      options,
                      },
                    Payload::default())
                ]).wait(true))
            .await?;

    Ok(())
}
