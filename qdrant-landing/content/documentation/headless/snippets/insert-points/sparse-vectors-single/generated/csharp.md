```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
  collectionName: "{collection_name}",
  points: new List < PointStruct > {
    new() {
      Id = 1,
        Vectors = new Dictionary <string, Vector> {
          ["text"] = ([0.1f, 0.2f, 0.3f, 0.4f], [1, 3, 5, 7])
        }
    }
  }
);
```
