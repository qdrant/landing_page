```rust
async fn sync(
    client: &Qdrant,
    latest_chunks: &[Chunk],
) -> anyhow::Result<HashMap<&'static str, usize>> {
    check_gate(client).await?; // refuse to mix embedding models or pipeline versions

    let chunks = prepare_chunks_for_sync(latest_chunks);
    let (incoming_ids, unchanged, content_changed, unknown_ids) =
        split_by_state(client, &chunks).await?;

    re_embed_changed(client, &content_changed).await?;
    let (reused, added) = reuse_or_add(client, &unknown_ids).await?;
    let deleted = delete_gone(client, &incoming_ids).await?;

    Ok(HashMap::from([
        ("unchanged", unchanged.len()),
        ("re-embedded", content_changed.len()),
        ("reused_embedding", reused),
        ("added", added),
        ("deleted", deleted as usize),
    ]))
}
```
