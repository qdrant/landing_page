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
                    Text = "La Máquina del Tiempo",
                    Model = "qdrant/bm25",
                },
            },
            Payload =
            {
                ["title"] = "La Máquina del Tiempo",
                ["author"] = "H.G. Wells",
                ["isbn"] = "9788411486880",
            },
        },
    }
);
```
