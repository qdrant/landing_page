```typescript
const imageToTextResults = await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.query(collectionName, {
        query: { image: imageToBase64Url("images/image-2.png"), model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
        using: "text",
        with_payload: ["caption"],
        limit: 1,
    })
);

console.log(imageToTextResults.points[0].payload!.caption);
```
