```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "books",
    query: new Document { Text = "time travel", Model = "qdrant/bm25" },
    usingVector: "title-bm25",
    payloadSelector: true,
    limit: 10
);
```
