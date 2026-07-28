```typescript
function payload(c: SyncChunk) {
    return {
        url: c.url,
        anchor: c.anchor,
        chunk_num: c.chunk_num,
        section_url: c.section_url,
        text: c.text,
        content_hash: c.content_hash,
        sync_bucket: bucket(c.point_id),
    };
}
```
