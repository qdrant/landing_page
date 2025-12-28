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
                Text = "9780553213515",
                Model = "sentence-transformers/all-minilm-l6-v2",
            },
            ScoreThreshold = 0.5f,
        },
        new()
        {
            Using = "isbn-bm25",
            Query = new Document { Text = "9780553213515", Model = "Qdrant/bm25" },
        },
    },
    query: Fusion.Rrf,
    payloadSelector: true,
    limit: 10
);
```
