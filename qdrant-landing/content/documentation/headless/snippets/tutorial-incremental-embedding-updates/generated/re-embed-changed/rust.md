```rust
async fn re_embed_changed(client: &Qdrant, content_changed: &[Chunk]) -> anyhow::Result<()> {
    if content_changed.is_empty() {
        return Ok(());
    }
    let points: Vec<PointStruct> = content_changed
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
    Ok(())
}
```
