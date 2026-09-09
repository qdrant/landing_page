```typescript
const multilingualResults = await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.query(collectionName, {
        query: { text: "Componenti di un aereo", model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
        using: "image",
        with_payload: ["image"],
        limit: 1,
    })
);

console.log(multilingualResults.points[0].payload!.image);
```
