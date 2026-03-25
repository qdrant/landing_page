```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var excludeFilter = new Filter { MustNot = { MatchKeyword("author", "H.G. Wells") } };

await client.QueryAsync(
    collectionName: "books",
    query: new Document
    {
        Text = "time travel",
        Model = "sentence-transformers/all-minilm-l6-v2",
    },
    usingVector: "description-dense",
    filter: excludeFilter,
    payloadSelector: true
);
```
