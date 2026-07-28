```csharp
var META = "docs-sync-digests";
const int N_META = N_BUCKETS / GROUP_SIZE;

if (!await client.CollectionExistsAsync(META))
{
	await client.CreateCollectionAsync(
		collectionName: META,
		vectorsConfig: new VectorParams
		{
			Size = 1,
			Distance = Distance.Cosine
		}
	);
}
```
