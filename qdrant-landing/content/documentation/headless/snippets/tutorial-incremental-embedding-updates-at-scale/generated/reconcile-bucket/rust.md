```rust
/// Make bucket b in Qdrant match source_chunks. Returns (added, re_embedded, deleted).
async fn reconcile_bucket(
    client: &Qdrant,
    b: usize,
    source_chunks: &HashMap<String, Chunk>,
) -> anyhow::Result<(usize, usize, usize)> {
    let stored = read_bucket(client, b).await?; // point ID -> content hash currently in Qdrant

    let mut to_write = Vec::new(); // new or content-changed chunks: embed and upsert
    let (mut added, mut re_embedded) = (0, 0);
    for (pid, chunk) in source_chunks {
        match stored.get(pid) {
            None => {
                to_write.push(chunk.clone()); // new chunk in this bucket
                added += 1;
            }
            Some(hash) if hash != &chunk.content_hash => {
                to_write.push(chunk.clone()); // same chunk, changed text
                re_embedded += 1;
            }
            Some(_) => {}
        }
    }

    // chunks Qdrant has but the source no longer does
    let to_delete: Vec<PointId> = stored
        .keys()
        .filter(|pid| !source_chunks.contains_key(*pid))
        .map(|pid| PointId::from(pid.as_str()))
        .collect();
    let deleted = to_delete.len();

    if !to_write.is_empty() {
        client
            .upsert_points(UpsertPointsBuilder::new(MAIN, as_points(&to_write)?).wait(true))
            .await?;
    }
    if deleted > 0 {
        client
            .delete_points(
                DeletePointsBuilder::new(MAIN)
                    .points(PointsIdsList { ids: to_delete })
                    .wait(true),
            )
            .await?;
    }

    Ok((added, re_embedded, deleted))
}
```
