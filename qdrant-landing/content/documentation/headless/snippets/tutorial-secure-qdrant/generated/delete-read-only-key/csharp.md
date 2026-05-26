```csharp
client = new QdrantClient(host: "localhost", port: 6334, https: true, apiKey: "my-read-only-key");

try
{
	await client.DeleteAsync(collectionName: "my_collection", ids: (ulong[])[1]);
}
catch (Exception e)
{
	Console.WriteLine(e.Message); // PermissionDenied
}
```
