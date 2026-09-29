```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

await client.ScrollAsync(collectionName: "{collection_name}", filter: MatchKeyword("country.name", "Germany"));
```
