```typescript
client.query("{collection_name}", {
    query: {
        recommend: {
            positive: [100, 231],
            negative: [718],
        }
    },
    using: "image",
    limit: 10,
    lookup_from: {
        collection: "{external_collection_name}",
        vector: "{external_vector_name}"
    }
});
```
