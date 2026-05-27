```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

client = new QdrantClient(host: "localhost", port: 6334, https: true);

try
{
	await client.CreateCollectionAsync(
		collectionName: "my_collection",
		vectorsConfig: new VectorParams { Size = 4, Distance = Distance.Cosine }
	);

	await client.UpsertAsync(
		collectionName: "my_collection",
		points: new List<PointStruct>
		{
			new() { Id = 1, Vectors = new[] { 0.1f, 0.2f, 0.3f, 0.4f } }
		}
	);
}
catch (Exception e)
{
	Console.WriteLine(e.Message); // Unauthenticated
}

client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "my-admin-key");

await client.CreateCollectionAsync(
	collectionName: "my_collection",
	vectorsConfig: new VectorParams { Size = 4, Distance = Distance.Cosine }
);

await client.UpsertAsync(
	collectionName: "my_collection",
	points: new List<PointStruct>
	{
		new() { Id = 1, Vectors = new[] { 0.1f, 0.2f, 0.3f, 0.4f } }
	}
);

client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "my-read-only-key");

try
{
	await client.DeleteAsync(collectionName: "my_collection", ids: (ulong[])[1]);
}
catch (Exception e)
{
	Console.WriteLine(e.Message); // PermissionDenied
}

client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "<your-jwt>");

await client.UpsertAsync(
	collectionName: "my_collection",
	points: new List<PointStruct>
	{
		new() { Id = 2, Vectors = new[] { 0.5f, 0.6f, 0.7f, 0.8f } }
	}
);

client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "<your-jwt>");

try
{
	await client.UpsertAsync(
		collectionName: "other_collection",
		points: new List<PointStruct>
		{
			new() { Id = 2, Vectors = new[] { 0.5f, 0.6f, 0.7f, 0.8f } }
		}
	);
}
catch (Exception e)
{
	Console.WriteLine(e.Message); // PermissionDenied
}
```
