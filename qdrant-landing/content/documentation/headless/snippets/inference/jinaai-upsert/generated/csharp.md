```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

using (RequestHeaders.Use("jina-api-key", "<YOUR_JINAAI_API_KEY>"))
    await client.UpsertAsync(
        collectionName: "{collection_name}",
        points: new List<PointStruct>
        {
            new()
            {
                Id = 1,
                Vectors = new Image()
                {
                    Model = "jinaai/jina-clip-v2",
                    Image_ = "https://qdrant.tech/example.png",
                    Options = { ["dimensions"] = 512 },
                },
            },
        }
    );
```
