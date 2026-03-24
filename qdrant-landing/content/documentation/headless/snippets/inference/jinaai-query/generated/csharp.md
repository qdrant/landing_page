```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
    collectionName: "{collection_name}",
    query: new Document()
    {
        Model = "jinaai/jina-clip-v2",
        Text = "Mission to Mars",
        Options = { ["jina-api-key"] = "<YOUR_JINAAI_API_KEY>", ["dimensions"] = 512 },
    }
);
```
