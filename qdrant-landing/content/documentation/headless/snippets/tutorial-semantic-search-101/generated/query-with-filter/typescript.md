```typescript
const queryResultFiltered = await client.query(collectionName, {
    query: {
        text: "alien invasion",
        model: embeddingModel,
    },
    filter: {
        must: [
            {
                key: "year",
                range: {
                    gte: 2000,
                },
            },
        ],
    },
    limit: 1,
});

for (const hit of queryResultFiltered.points) {
    console.log(hit.payload, "score:", hit.score);
}
```
