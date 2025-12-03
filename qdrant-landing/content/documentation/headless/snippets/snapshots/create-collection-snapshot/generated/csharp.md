```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.CreateSnapshotAsync("{collection_name}");
```
