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
			Vectors = new Dictionary<string, Vector> { ["text"] = ([1.0f, 2.0f], [6, 7]) }
		},
		new()
		{
			Id = 2,
			Vectors = new Dictionary<string, Vector>
			{
				["text"] = ([0.1f, 0.2f, 0.3f, 0.4f, 0.5f], [1, 2, 3, 4, 5])
			}
		}
	}
);
```
