```rust
use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Document, Image, PointStruct, Query, QueryPointsBuilder, UpsertPointsBuilder},
};

let points = vec![PointStruct::new(
    1,
    Image {
        image: Some("https://qdrant.tech/example.png".into()),
        model: "qdrant/clip-vit-b-32-vision".into(),
        ..Default::default()
    },
    Payload::try_from(serde_json::json!({
        "title": "Example Image"
    }))?,
)];

client
    .upsert_points(UpsertPointsBuilder::new("<your-collection>", points).wait(true))
    .await?;

let query_document = Document {
    text: "Mission to Mars".into(),
    model: "qdrant/clip-vit-b-32-text".into(),
    ..Default::default()
};

let result = client
    .query(
        QueryPointsBuilder::new("<your-collection>")
            .query(Query::new_nearest(query_document))
            .build(),
    )
    .await?;

println!("Result: {:?}", result);
```
