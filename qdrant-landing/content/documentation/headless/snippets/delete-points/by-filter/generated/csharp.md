```csharp
using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

var client = new QdrantClient("localhost", 6334);

await client.DeleteAsync(collectionName: "{collection_name}", filter: MatchKeyword("color", "red"));
```
