```typescript
client.queryGroups("chunks", {
    query: [0.2, 0.1, 0.9, 0.7],
    group_by: "document_id",
    limit: 2,
    group_size: 2,
    with_lookup: {
        collection: "documents",
        with_payload: ["title", "text"],
        with_vectors: false,
    },
});
```
