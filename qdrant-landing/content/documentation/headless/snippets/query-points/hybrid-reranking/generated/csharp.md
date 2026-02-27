```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List <PrefetchQuery> {
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Filter = MatchKeyword("color", "red"),
        Limit = 10
    },
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Filter = MatchKeyword("color", "green"),
        Limit = 10
    }
  },
  query: (OrderBy) "price",
  limit: 10
);
```
