```typescript
const cohereApiKey = process.env.COHERE_API_KEY!;

await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.upsert(collectionName, {
        points: documents.map((doc, idx) => ({
            id: idx,
            vector: {
                text: { text: doc.caption, model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
                image: { image: imageToBase64Url(doc.image), model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
            },
            payload: doc,
        })),
    })
);
```
