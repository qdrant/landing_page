```rust
fn payload(chunk: &Chunk, last_updated: Option<String>) -> anyhow::Result<Payload> {
    let last_updated = last_updated.unwrap_or_else(|| {
        chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, false)
    });
    Ok(Payload::try_from(serde_json::json!({
        "url": chunk.url,
        "anchor": chunk.anchor,
        "chunk_num": chunk.chunk_num,
        "section_url": chunk.section_url,
        "text": chunk.text,
        "content_hash": chunk.content_hash,
        "last_updated": last_updated,
    }))?)
}
```
