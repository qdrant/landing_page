```rust
let points: Vec<PointStruct> = prepare_chunks_for_sync(&chunks)
    .iter()
    .map(|c| {
        Ok(PointStruct::new(
            c.point_id.clone(),
            Document::new(&c.text, MODEL),
            payload(c, None)?,
        ))
    })
    .collect::<anyhow::Result<_>>()?;

client
    .upsert_points(UpsertPointsBuilder::new(COLLECTION, points).wait(true))
    .await?;
```
