```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient(
host: "xyz-example.qdrant.io", port: 6334, https: true, apiKey: "<your-api-key>");

await client.UpsertAsync(
    collectionName: "{collection_name}",
    points: new List<PointStruct>
    {
        new()
        {
            Id = 1,
            Vectors = new Document()
            {
                Model = "openai/text-embedding-3-large",
                Text = "Recipe for baking chocolate chip cookies",
                Options = { ["openai-api-key"] = "<YOUR_OPENAI_API_KEY>", ["dimensions"] = 512 },
            },
        },
    }
);
```
