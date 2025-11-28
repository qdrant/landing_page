```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List<PrefetchQuery> {
    new() {
      Query = new float[] { 1,23, 45, 67 }, // <------------- small byte vector
        Using = "mrl_byte",
        Limit = 1000
    }
  },
  query: new float[] { 0.01f, 0.299f, 0.45f, 0.67f }, // <-- full vector
  usingVector: "full",
  limit: 10
);
```
