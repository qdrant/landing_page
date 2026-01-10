```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "books",
    query: new Document { Text = "time travel", Model = "prithivida/splade_pp_en_v1" },
    usingVector: "title-splade",
    payloadSelector: true,
    limit: 10
);
```
