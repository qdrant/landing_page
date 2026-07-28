```rust
#[derive(Clone, Default)]
struct Chunk {
    url: String,
    anchor: String,
    chunk_num: u32,
    text: String,
    section_url: String,  // derived in prepare
    content_hash: String, // derived in prepare
    point_id: String,     // derived in prepare
}

let chunks: Vec<Chunk> = vec![
    Chunk {
        url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
        anchor: "prerequisites".into(),
        chunk_num: 0,
        text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...".into(),
        ..Default::default()
    },
    Chunk {
        url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
        anchor: "step-2-enable-tls".into(),
        chunk_num: 0,
        text: "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ...".into(),
        ..Default::default()
    },
    Chunk {
        url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
        anchor: "step-3-enable-an-admin-api-key".into(),
        chunk_num: 0,
        text: "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ...".into(),
        ..Default::default()
    },
];
```
