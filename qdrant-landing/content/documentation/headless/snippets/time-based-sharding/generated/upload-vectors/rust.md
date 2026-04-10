```rust
let csv_url = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

let response = client.list_shard_keys(collection_name).await?;
let mut existing_shard_keys: HashSet<String> = response
    .shard_keys
    .into_iter()
    .filter_map(|d| {
        d.key?.key.and_then(|k| match k {
            shard_key::Key::Keyword(s) => Some(s),
            _ => None,
        })
    })
    .collect();

let dense_model = "sentence-transformers/all-MiniLM-L6-v2";
let batch_size = 100;
let mut current_date = String::new();
let mut buffer: Vec<PointStruct> = Vec::new();

let bytes = reqwest::get(csv_url).await?.bytes().await?;
let mut rdr = csv::Reader::from_reader(bytes.as_ref());
let headers = rdr.headers()?.clone();
let text_idx = headers.iter().position(|h| h == "text").unwrap();
let datetime_idx = headers.iter().position(|h| h == "datetime").unwrap();

for result in rdr.records() {
    let record = result?;
    let text = record[text_idx].to_string();
    let datetime = record[datetime_idx].to_string();
    let shard_date = datetime[..10].to_string(); // Extract YYYY-MM-DD

    if shard_date != current_date {
        // Flush buffer for the previous date before switching
        if !buffer.is_empty() {
            client
                .upsert_points(
                    UpsertPointsBuilder::new(
                        collection_name,
                        std::mem::take(&mut buffer),
                    )
                    .shard_key_selector(current_date.clone()),
                )
                .await?;
        }

        // Create shard for the new date if it doesn't exist yet
        if !existing_shard_keys.contains(&shard_date) {
            client
                .create_shard_key(
                    CreateShardKeyRequestBuilder::new(collection_name).request(
                        CreateShardKeyBuilder::default().shard_key(shard_date.clone()),
                    ),
                )
                .await?;
            existing_shard_keys.insert(shard_date.clone());
        }

        current_date = shard_date;
    }

    buffer.push(PointStruct::new(
        uuid::Uuid::new_v4().to_string(),
        HashMap::from([(
            "dense_vector".to_string(),
            DocumentBuilder::new(&text, dense_model).build(),
        )]),
        [("text", text.into()), ("datetime", datetime.into())],
    ));

    if buffer.len() >= batch_size {
        client
            .upsert_points(
                UpsertPointsBuilder::new(collection_name, std::mem::take(&mut buffer))
                    .shard_key_selector(current_date.clone()),
            )
            .await?;
    }
}

// Flush remaining partial batch
if !buffer.is_empty() {
    client
        .upsert_points(
            UpsertPointsBuilder::new(collection_name, buffer)
                .shard_key_selector(current_date.clone()),
        )
        .await?;
}
```
