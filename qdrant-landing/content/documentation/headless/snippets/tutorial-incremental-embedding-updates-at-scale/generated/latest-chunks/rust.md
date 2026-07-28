```rust
let latest_source: Vec<Chunk> = vec![
    // unchanged
    Chunk {
        url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
        anchor: "prerequisites".into(),
        chunk_num: 0,
        text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...".into(),
        ..Default::default()
    },
    // edited text
    Chunk {
        url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
        anchor: "step-2-enable-tls".into(),
        chunk_num: 0,
        text: "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ...".into(),
        ..Default::default()
    },
    // step-3 removed; new step-4 added
    Chunk {
        url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/".into(),
        anchor: "step-4-restrict-access".into(),
        chunk_num: 0,
        text: "Step 4: Restrict access with read-only API keys for untrusted clients ...".into(),
        ..Default::default()
    },
];
```
