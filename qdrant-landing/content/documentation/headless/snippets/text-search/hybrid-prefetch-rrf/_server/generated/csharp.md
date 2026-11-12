```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "books",
    prefetch: new List<PrefetchQuery>
    {
        new()
        {
            Using = "description-dense",
            Query = new Document
            {
                Text = "time travel",
                Model = "sentence-transformers/all-minilm-l6-v2",
            },
            ScoreThreshold = 0.5f,
        },
        new()
        {
            Using = "title",
            Query = new Query { Text = new TextQuery { Query = "time travel" } },
        },
    },
    query: Fusion.Rrf,
    payloadSelector: true,
    limit: 10
);
```
