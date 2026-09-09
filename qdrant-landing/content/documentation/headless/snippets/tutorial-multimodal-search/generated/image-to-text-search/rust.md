```rust
let results = client
    .with_header("cohere-api-key", &cohere_api_key)
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(
                ImageBuilder::new_from_base64(
                    image_to_base64_url("images/image-2.png")?,
                    "cohere/embed-v4.0",
                )
                .options(options.clone())
                .build(),
            ))
            .using("text")
            .with_payload(true)
            .limit(1),
    )
    .await?;

println!("{:?}", results.result[0].payload.get("caption"));
```
