```rust
use qdrant_client::{
    Payload, Qdrant,
    qdrant::{Document, PointStruct, Query, QueryPointsBuilder, UpsertPointsBuilder},
};

let points = vec![PointStruct::new(
    1,
    Document {
        text: "Recipe for baking chocolate chip cookies".into(),
        model: "<the-model-to-use>".into(),
        ..Default::default()
    },
    Payload::try_from(serde_json::json!(
        {"topic": "cooking", "type": "dessert"}
    ))?,
)];

client
    .upsert_points(UpsertPointsBuilder::new("<your-collection>", points).wait(true))
    .await?;

let query_document = Document {
    text: "How to bake cookies?".into(),
    model: "<the-model-to-use>".into(),
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
