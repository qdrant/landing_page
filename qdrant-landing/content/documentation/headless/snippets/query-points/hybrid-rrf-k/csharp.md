```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  prefetch: new List < PrefetchQuery > {
      // 2+ prefetches here
  },
  query: Fusion.Rrf <--- TODO
);
```
