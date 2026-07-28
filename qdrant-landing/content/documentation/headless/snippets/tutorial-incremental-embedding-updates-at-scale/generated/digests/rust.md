```rust
fn chunk_digest(pid: &str, chash: &str) -> u64 {
    // First 15 hex digits of the combined hash = a 60-bit number.
    // 60 bits fits Qdrant's signed 64-bit integer payload, so digests store as plain integers.
    let combined: String = Sha256::digest(format!("{pid}{chash}").as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect();
    u64::from_str_radix(&combined[..15], 16).unwrap_or(0)
}

fn compute_digests(chunks: &[Chunk]) -> Vec<u64> {
    let mut digests = vec![0u64; N_BUCKETS];
    for c in chunks {
        let b = bucket(&c.point_id);
        digests[b] ^= chunk_digest(&c.point_id, &c.content_hash);
    }
    digests
}

compute_digests(&prepare(&chunks));
```
