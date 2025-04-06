```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpsertAsync(
	collectionName: "{collection_name}",
	points: new List<PointStruct>
	{
		new()
		{
			Id = 1,
			Vectors = new[] { 0.9f, 0.1f, 0.1f },
			Payload = { ["color"] = "red" }
		},
		new()
		{
			Id = 2,
			Vectors = new[] { 0.1f, 0.9f, 0.1f },
			Payload = { ["color"] = "green" }
		},
		new()
		{
			Id = 3,
			Vectors = new[] { 0.1f, 0.1f, 0.9f },
			Payload = { ["color"] = "blue" }
		}
	}
);
```
