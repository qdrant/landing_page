```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.DeletePayloadAsync(
    collectionName: "{collection_name}",
    keys: ["color", "price"],
    filter: MatchKeyword("color", "red")
);
```
