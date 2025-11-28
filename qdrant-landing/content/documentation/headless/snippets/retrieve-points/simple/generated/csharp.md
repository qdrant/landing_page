```csharp
using Qdrant.Client;

var client = new QdrantClient("localhost", 6334);

await client.RetrieveAsync(
	collectionName: "{collection_name}",
	ids: [0, 30, 100],
	withPayload: false,
	withVectors: false
);
```
