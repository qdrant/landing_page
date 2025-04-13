```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
    collectionName: "{collection_name}",
    points: new List<PointStruct>
    {
        new PointStruct
        {
            Id = 1,
            Vectors = new[] { 0.05f, 0.61f, 0.76f, 0.74f },
            Payload = { ["city"] = "Berlin", ["price"] = 1.99 }
        },
        new PointStruct
        {
            Id = 2,
            Vectors = new[] { 0.19f, 0.81f, 0.75f, 0.11f },
            Payload = { ["city"] = new[] { "Berlin", "London" } }
        },
        new PointStruct
        {
            Id = 3,
            Vectors = new[] { 0.36f, 0.55f, 0.47f, 0.94f },
            Payload =
            {
                ["city"] = new[] { "Berlin", "Moscow" },
                ["price"] = new Value
                {
                    ListValue = new ListValue { Values = { new Value[] { 1.99, 2.99 } } }
                }
            }
        }
    }
);
```
