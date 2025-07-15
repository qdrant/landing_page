```rust
use qdrant_client::qdrant::Query;
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::Payload;
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Document, Image};
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
            Image::new_from_url(
                "https://qdrant.tech/example.png",
                "qdrant/clip-vit-b-32-vision"
            ),
            Payload::try_from(serde_json::json!({
                "title": "Example Image"
            })).unwrap(),
        )
    ];

    let upsert_request = UpsertPointsBuilder::new(
        "<your-collection>",
        points
    ).wait(true);

    let _ = client.upsert_points(upsert_request).await;

    let query_document = Document::new(
        "Mission to Mars",
        "qdrant/clip-vit-b-32-text"
    );

    let query_request = QueryPointsBuilder::new("<your-collection>")
        .query(Query::new_nearest(query_document));

    let result = client.query(query_request).await.unwrap();
    println!("Result: {:?}", result);
}
```
