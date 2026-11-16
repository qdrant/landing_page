```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
    collectionName: "{collection_name}",
    prefetch:
    [
        new PrefetchQuery { Query = new float[] { 0.01f, 0.45f, 0.67f }, Using = "title", Limit = 50 },
        new PrefetchQuery { Query = new float[] { 0.01f, 0.45f, 0.67f }, Using = "summary", Limit = 50 },
    ],
    query: new Formula
    {
        Expression = new MaxExpression { Max = { "$score[0]", "$score[1]" } },
        // used when a point is missing from the second prefetch
        Defaults = { ["$score[1]"] = -1e30 },
    },
    limit: 10
);
```
