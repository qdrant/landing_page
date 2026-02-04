```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var andFilter = new Filter
{
    Must =
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
    filter: andFilter,
    payloadSelector: true
);
```
