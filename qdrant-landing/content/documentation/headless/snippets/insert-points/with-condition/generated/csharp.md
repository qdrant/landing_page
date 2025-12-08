```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
    collectionName: "{collection_name}",
    points: new List<PointStruct>
    {
        new PointStruct
        {
            Id = 1,
            Vectors = new[] { 0.05f, 0.61f, 0.76f, 0.74f },
            Payload = { 
                ["city"] = "Berlin",
                ["price"] = 1.99,
                ["version"] = 3
            }
        }
    },
    updateFilter: Match("version", 2)
);
```
