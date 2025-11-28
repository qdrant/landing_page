```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.UpsertAsync(
    collectionName: "{collection_name}",
    points: new List<PointStruct>
    {
        new()
        {
            Id = 1,
            Vectors = new Dictionary<string, Vector>
            {
                ["image"] = new() {
                    Data = {0.9f, 0.1f, 0.1f, 0.2f}
                },
                ["text"] = new() {
                    Data = {0.4f, 0.7f, 0.1f, 0.8f, 0.1f}
                },
                ["text-sparse"] = ([0.1f, 0.2f, 0.3f, 0.4f], [1, 3, 5, 7]),
            }
        }
    }
);
```
