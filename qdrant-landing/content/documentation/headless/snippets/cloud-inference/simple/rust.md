```rust
use qdrant_client::qdrant::vector;
use qdrant_client::qdrant::vector_input;
use qdrant_client::qdrant::QueryPointsBuilder;
use qdrant_client::qdrant::Vector;
use qdrant_client::qdrant::VectorInput;
use qdrant_client::Payload;
use qdrant_client::Qdrant;
use qdrant_client::qdrant::{Document};
use qdrant_client::qdrant::{PointStruct, UpsertPointsBuilder};

#[tokio::main]
async fn main() {
    let client = Qdrant::from_url("https://xyz-example.cloud-region.cloud-provider.cloud.qdrant.io:6334")
        .api_key("<paste-your-api-key-here>")
        .build()
        .unwrap();

    let mut points = Vec::new();

    let vector = Vector {
        vector: Some(vector::Vector::Document(Document {
            text: "Recipe for baking chocolate chip cookies requires flour, sugar, eggs, and chocolate chips.".to_string(),
            model: "<the-model-to-use>".to_string(),
            options: Default::default(),
        })),
        ..Default::default()
    };

    points.push(PointStruct::new(1, vector, Payload::default()));

    let _ = client
        .upsert_points(UpsertPointsBuilder::new("<your-collection>", points).wait(true))
        .await;

    let document = Document {
        text: "Recipe for baking chocolate chip cookies".to_string(),
        model: "<the-model-to-use>".to_string(),
        options: Default::default(),
    };

    let query = VectorInput {
        variant: Some(vector_input::Variant::Document(document)),
    };

    let query_request = QueryPointsBuilder::new("<your-collection>").query(query);

    let result = client.query(query_request).await.unwrap();
    println!("Result: {:?}", result);
```
