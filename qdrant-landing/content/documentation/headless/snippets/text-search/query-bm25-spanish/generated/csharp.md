```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.QueryAsync(
    collectionName: "books",
    query: new Document
    {
        Text = "tiempo",
        Model = "qdrant/bm25",
        Options = { ["language"] = "spanish" }
    },
    usingVector: "title-bm25",
    payloadSelector: true,
    limit: 10
);
```
