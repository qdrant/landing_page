```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document { Text = "time travel", Model = "qdrant/bm25" },
    usingVector: "title-bm25",
    filter: new Filter
    {
        Must =
        {
            MatchKeyword("group_id", "user_1"),
            Match("year", 2024),
        },
    },
    searchParams: new SearchParams
    {
        Idf = new IdfParams
        {
            Corpus = new Filter
            {
                Must = { MatchKeyword("group_id", "user_1") },
            },
        },
    },
    payloadSelector: true,
    limit: 10
);
```
