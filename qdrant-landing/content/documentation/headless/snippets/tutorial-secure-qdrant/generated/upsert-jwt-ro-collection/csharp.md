```csharp
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
