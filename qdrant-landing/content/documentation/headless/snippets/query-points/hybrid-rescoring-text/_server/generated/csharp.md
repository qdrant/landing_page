```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    prefetch: new List<PrefetchQuery>
    {
        new()
        {
            Query = new float[] { 0.01f, 0.45f, 0.67f },
            Using = "dense",
            Limit = 100,
        },
    },
    query: new Query { Text = new TextQuery { Query = "time travel" } },
    usingVector: "title",
    limit: 10
);
```
