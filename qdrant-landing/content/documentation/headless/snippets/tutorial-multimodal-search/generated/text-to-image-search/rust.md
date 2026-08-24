```rust
let results = client
    .with_header("cohere-api-key", &cohere_api_key)
    .query(
        QueryPointsBuilder::new(collection_name)
            .query(Query::new_nearest(
                DocumentBuilder::new("Plane components", "cohere/embed-v4.0")
                    .options(options.clone())
                    .build(),
            ))
            .using("image")
            .with_payload(true)
            .limit(1),
    )
    .await?;

println!("{:?}", results.result[0].payload.get("image"));
```
