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
        Text = "村上春樹",
        Model = "qdrant/bm25",
        Options = { ["tokenizer"] = "multilingual" }
    },
    usingVector: "author-bm25",
    payloadSelector: true,
    limit: 10
);
```
