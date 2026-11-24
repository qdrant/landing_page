```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(collectionName: "{collection_name}", query: Sample.Random);
```
