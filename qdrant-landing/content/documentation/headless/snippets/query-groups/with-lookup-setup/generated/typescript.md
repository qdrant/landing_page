```typescript
await client.createCollection("chunks", {
    vectors: { size: 4, distance: "Cosine" },
});

await client.createPayloadIndex("chunks", {
    field_name: "document_id",
    field_schema: "integer",
});

await client.createCollection("documents", {
    vectors: {}, // no vectors, payload only
});
```
