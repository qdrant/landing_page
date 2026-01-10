```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "books",
    query: new Document
    {
        Text = "Mieville",
        Model = "qdrant/bm25",
        Options = { ["ascii_folding"] = true },
    },
    usingVector: "author-bm25",
    payloadSelector: true,
    limit: 10
);
```
