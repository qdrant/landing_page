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
			Vectors = new Dictionary<string, float[]>
			{
				["image"] = [0.9f, 0.1f, 0.1f, 0.2f],
				["text"] = [0.4f, 0.7f, 0.1f, 0.8f, 0.1f, 0.1f, 0.9f, 0.2f]
			}
		},
		new()
		{
			Id = 2,
			Vectors = new Dictionary<string, float[]>
			{
				["image"] = [0.2f, 0.1f, 0.3f, 0.9f],
				["text"] = [0.5f, 0.2f, 0.7f, 0.4f, 0.7f, 0.2f, 0.3f, 0.9f]
			}
		}
	}
);
```
