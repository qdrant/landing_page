```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.ListSnapshotsAsync("{collection_name}");
```
