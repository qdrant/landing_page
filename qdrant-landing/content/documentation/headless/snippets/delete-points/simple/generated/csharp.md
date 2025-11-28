```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.DeleteAsync(collectionName: "{collection_name}", ids: [0, 3, 100]);
```
