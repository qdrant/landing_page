```rust
/// Remove every point the current crawl no longer contains. Returns how many.
async fn delete_gone(
    client: &Qdrant,
    incoming_ids: &HashMap<String, Chunk>,
) -> anyhow::Result<u64> {
    if incoming_ids.is_empty() {
        anyhow::bail!("Refusing to delete from an empty source snapshot.");
    }

    let stale = Filter::must_not([Condition::has_id(
        incoming_ids.keys().map(|id| PointId::from(id.as_str())),
    )]);

    let to_delete = client
        .count(CountPointsBuilder::new(COLLECTION).filter(stale.clone()))
        .await?
        .result
        .map(|r| r.count)
        .unwrap_or(0);

    // potential check against a threshold to avoid accidental mass deletion could be added here
    client
        .delete_points(DeletePointsBuilder::new(COLLECTION).points(stale).wait(true))
        .await?;
    Ok(to_delete)
}
```
