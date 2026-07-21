```typescript
for (const field of ["content_hash", "url", "section_url"]) {
    await client.createPayloadIndex(COLLECTION, {
        field_name: field,
        field_schema: "keyword",
    });
}
```
