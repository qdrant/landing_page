```rust
fn as_points(chunks: &[Chunk]) -> anyhow::Result<Vec<PointStruct>> {
    chunks
        .iter()
        .map(|c| {
            Ok(PointStruct::new(
                c.point_id.clone(),
                Document::new(&c.text, MODEL), // embedded by Qdrant Cloud Inference
                payload(c)?,
            ))
        })
        .collect()
}

client
    .upsert_points(UpsertPointsBuilder::new(MAIN, as_points(&prepare(&chunks))?).wait(true))
    .await?;
```
