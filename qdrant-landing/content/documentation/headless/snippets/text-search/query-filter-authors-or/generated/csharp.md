```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var orFilter = new Filter
{
    Should =
    {
        MatchKeyword("author", "Larry Niven"),
        MatchKeyword("author", "Jerry Pournelle"),
    },
};

await client.QueryAsync(
    collectionName: "books",
    query: new Document
    {
        Text = "space opera",
        Model = "sentence-transformers/all-minilm-l6-v2",
    },
    usingVector: "description-dense",
    filter: orFilter,
    payloadSelector: true
);
```
