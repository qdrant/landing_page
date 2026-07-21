```rust
fn content_hash(text: &str) -> String {
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn point_id(url: &str, anchor: &str, num: u32) -> String {
    // NAMESPACE_URL is a fixed constant uuid5 requires; it marks the input as a URL-like name
    uuid::Uuid::new_v5(
        &uuid::Uuid::NAMESPACE_URL,
        format!("{url}#{anchor}::{num}").as_bytes(),
    )
    .to_string()
}

/// Derive both values (and the section address) for every raw chunk.
fn prepare_chunks_for_sync(chunks: &[Chunk]) -> Vec<Chunk> {
    chunks
        .iter()
        .map(|c| {
            let text = normalize(&c.text);
            Chunk {
                text: text.clone(),
                section_url: if c.anchor.is_empty() {
                    c.url.clone()
                } else {
                    format!("{}#{}", c.url, c.anchor)
                },
                content_hash: content_hash(&text),
                point_id: point_id(&c.url, &c.anchor, c.chunk_num),
                ..c.clone()
            }
        })
        .collect()
}
```
