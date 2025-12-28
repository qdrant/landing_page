```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "books",
    query: new Document
    {
        Text = "tiempo",
        Model = "qdrant/bm25",
        Options = { ["language"] = "spanish" },
    },
    usingVector: "title-bm25",
    payloadSelector: true,
    limit: 10
);
```
