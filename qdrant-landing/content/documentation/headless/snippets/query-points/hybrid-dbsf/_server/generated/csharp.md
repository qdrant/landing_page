```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List < PrefetchQuery > {
    new() {
      Query = new Query { Text = new TextQuery { Query = "time travel" } },
        Using = "title",
        Limit = 20
    },
    new() {
      Query = new float[] {
          0.01f, 0.45f, 0.67f
        },
        Using = "dense",
        Limit = 20
    }
  },
  query: Fusion.Dbsf
);
```
