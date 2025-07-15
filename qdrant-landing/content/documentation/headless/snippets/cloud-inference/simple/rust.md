```rust
use qdrant_client::qdrant::Query;
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::Payload;
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Document};
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

#[tokio::main]
async fn main() {
    let client = Qdrant::from_url("https://xyz-example.qdrant.io:6334")
        .api_key("<paste-your-api-key-here>")
        .build()
        .unwrap();

    let points = vec![
        PointStruct::new(
            1,
            Document::new(
                "Recipe for baking chocolate chip cookies",
                "<the-model-to-use>"
            ),
            Payload::try_from(serde_json::json!(
                {"topic": "cooking", "type": "dessert"}
            )).unwrap(),
        )
    ];

    let upsert_request = UpsertPointsBuilder::new(
        "<your-collection>",
        points
    ).wait(true);

    let _ = client.upsert_points(upsert_request).await;

    let query_document = Document::new(
        "How to bake cookies?",
        "<the-model-to-use>"
    );

    let query_request = QueryPointsBuilder::new("<your-collection>")
        .query(Query::new_nearest(query_document));

    let result = client.query(query_request).await.unwrap();
    println!("Result: {:?}", result);
}
```
