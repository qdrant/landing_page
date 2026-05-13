```rust
let mut last_offset = None;
let batch_size = 100;

loop {
    let mut scroll_builder = ScrollPointsBuilder::new(collection)
        .limit(batch_size)
        .with_payload(true)
        .with_vectors(false);

    if let Some(offset) = last_offset {
        scroll_builder = scroll_builder.offset(offset);
    }

    let scroll_result = client.scroll(scroll_builder).await?;
    let records = scroll_result.result;
    last_offset = scroll_result.next_page_offset;

    // Update only the new vector on each point; the old vector and payload are untouched
    let point_vectors: Vec<PointVectors> = records
        .iter()
        .map(|record| PointVectors {
            id: record.id.clone(),
            vectors: Some(
                HashMap::<String, Document>::from([(
                    new_vector.to_string(),
                    Document::new(
                        record.payload.get("text")
                            .and_then(|v| v.as_str())
                            .map_or("", |v| v),
                        new_model,
                    ),
                )])
                .into(),
            ),
        })
        .collect();

    client
        .update_vectors(UpdatePointVectorsBuilder::new(collection, point_vectors))
        .await?;

    if last_offset.is_none() {
        break;
    }
}
```
