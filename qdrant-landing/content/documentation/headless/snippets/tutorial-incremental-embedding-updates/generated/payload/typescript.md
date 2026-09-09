```typescript
function payload(chunk: SyncChunk, lastUpdated?: string) {
    return {
        url: chunk.url,
        anchor: chunk.anchor,
        chunk_num: chunk.chunk_num,
        section_url: chunk.section_url,
        text: chunk.text,
        content_hash: chunk.content_hash,
        last_updated: lastUpdated ?? new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    };
}
```
