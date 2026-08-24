```rust
let cohere_api_key = std::env::var("COHERE_API_KEY")?;

let mut options: HashMap<String, Value> = HashMap::new();
options.insert("output_dimension".to_string(), 512i64.into());

let mut points = Vec::new();
for (idx, doc) in documents.iter().enumerate() {
    let vectors = NamedVectors::default()
        .add_vector(
            "text",
            DocumentBuilder::new(doc.caption, "cohere/embed-v4.0")
                .options(options.clone())
                .build(),
        )
        .add_vector(
            "image",
            ImageBuilder::new_from_base64(image_to_base64_url(doc.image)?, "cohere/embed-v4.0")
                .options(options.clone())
                .build(),
        );

    points.push(PointStruct::new(
        idx as u64,
        vectors,
        [
            ("caption", doc.caption.into()),
            ("image", doc.image.into()),
        ],
    ));
}

client
    .with_header("cohere-api-key", &cohere_api_key)
    .upsert_points(UpsertPointsBuilder::new(collection_name, points))
    .await?;
```
