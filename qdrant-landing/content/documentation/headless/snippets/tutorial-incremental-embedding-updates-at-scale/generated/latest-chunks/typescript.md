```typescript
const LATEST: RawChunk[] = [
    // unchanged
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "prerequisites", chunk_num: 0,
      text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ..." },
    // edited text
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "step-2-enable-tls", chunk_num: 0,
      text: "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ..." },
    // step-3 removed; new step-4 added
    { url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
      anchor: "step-4-restrict-access", chunk_num: 0,
      text: "Step 4: Restrict access with read-only API keys for untrusted clients ..." },
];
```
