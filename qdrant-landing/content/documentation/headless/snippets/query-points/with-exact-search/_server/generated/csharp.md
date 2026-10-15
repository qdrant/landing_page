```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.QueryAsync(
	collectionName: "{collection_name}",
	query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
	searchParams: new SearchParams { Exact = true },
	limit: 10
);
```
