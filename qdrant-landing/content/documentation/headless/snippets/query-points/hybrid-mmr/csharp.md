```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List<PrefetchQuery> {
    new() {
      Query = new float[] { 0.01f, 0.45f, 0.67f }, // <-- search vector
      Limit = 100
    }
  },
  query: new MmrInput {
    Vector = new float[] { 0.01f, 0.45f, 0.67f }, // <-- same vector
    Lambda = 0.5f
  }
);```
