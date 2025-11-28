```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.UpdateVectorsAsync(
	collectionName: "{collection_name}",
	points: new List<PointVectors>
	{
		new() { Id = 1, Vectors = ("image", new float[] { 0.1f, 0.2f, 0.3f, 0.4f }) },
		new()
		{
			Id = 2,
			Vectors = ("text", new float[] { 0.9f, 0.8f, 0.7f, 0.6f, 0.5f, 0.4f, 0.3f, 0.2f })
		}
	}
);
```
