```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.DeletePayloadAsync(
    collectionName: "{collection_name}",
    keys: ["color", "price"],
    ids: new ulong[] { 0, 3, 100 }
);
```
