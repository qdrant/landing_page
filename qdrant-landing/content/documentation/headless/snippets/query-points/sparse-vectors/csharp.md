```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.QueryAsync(
  collectionName: "{collection_name}",
  query: new (float, uint)[] {(0.1f, 1), (0.2f, 3), (0.3f, 5), (0.4f, 7)},
  usingVector: "text",
  limit: 3
);
```
