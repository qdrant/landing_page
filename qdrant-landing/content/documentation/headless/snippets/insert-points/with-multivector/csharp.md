```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
  collectionName: "{collection_name}",
  points: new List <PointStruct> {
    new() {
      Id = 1,
        Vectors = new float[][] {
          [-0.013f, 0.020f, -0.007f, -0.111f],
          [-0.030f, -0.05f, 0.001f, 0.072f],
          [-0.041f, 0.014f, -0.032f, -0.062f ],
        },
    },
  }
);
```
