```typescript
const collectionName = "my_books";

await client.createCollection(collectionName, {
    vectors: {
        size: 384, // Vector size is defined by used model
        distance: "Cosine",
    },
});
```
