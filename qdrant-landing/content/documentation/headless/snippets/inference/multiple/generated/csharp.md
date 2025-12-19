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
            Vectors = new Dictionary<string, Vector>
            {
                ["image"] = new Image()
                {
                    Model = "jinaai/jina-clip-v2",
                    Image_ = "https://qdrant.tech/example.png",
                    Options = { ["jina-api-key"] = "<YOUR_JINAAI_API_KEY>", ["dimensions"] = 512 },
                },
                ["text"] = new Document()
                {
                    Model = "sentence-transformers/all-minilm-l6-v2",
                    Text = "Mars, the red planet",
                },
                ["bm25"] = new Document() { Model = "qdrant/bm25", Text = "Mars, the red planet" },
            },
        },
    }
);
```
