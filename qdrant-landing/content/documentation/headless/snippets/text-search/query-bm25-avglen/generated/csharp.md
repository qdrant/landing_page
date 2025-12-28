```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "books",
    query: new Document
    {
        Text = "time travel",
        Model = "qdrant/bm25",
        Options = { ["avg_len"] = 5.0 },
    },
    usingVector: "title-bm25",
    payloadSelector: true,
    limit: 10
);
```
