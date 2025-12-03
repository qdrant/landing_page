```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.SetPayloadAsync(
    collectionName: "{collection_name}",
    payload: new Dictionary<string, Value> { { "property1", "string" }, { "property2", "string" } },
    ids: new ulong[] { 0, 3, 10 }
);
```
