```csharp
client = new QdrantClient(host: "localhost", port: 6334, https: true);

try
{
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
```
