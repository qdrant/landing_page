```typescript
const queryResult = await client.query(collectionName, {
    query: {
        text: "alien invasion",
        model: embeddingModel,
    },
    limit: 3,
});

for (const hit of queryResult.points) {
    console.log(hit.payload, "score:", hit.score);
}
```
