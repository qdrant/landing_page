```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpsertAsync(
    collectionName: "books",
    wait: true,
    points: new List<PointStruct>
    {
        new()
        {
            Id = 1,
            Vectors = new Dictionary<string, Vector>
            {
                ["title-bm25"] = new Document
                {
                    Text = "The Time Machine",
                    Model = "qdrant/bm25",
                },
            },
            Payload =
            {
                ["title"] = "The Time Machine",
                ["author"] = "H.G. Wells",
                ["isbn"] = "9780553213515",
            },
        },
    }
);
```
