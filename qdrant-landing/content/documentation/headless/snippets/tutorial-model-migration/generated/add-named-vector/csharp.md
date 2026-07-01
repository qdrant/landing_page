```csharp
await client.CreateVectorNameAsync(new()
{
	CollectionName = COLLECTION,
	VectorName = NEW_VECTOR,
	DenseConfig = new() { Size = 512, Distance = Distance.Cosine }
});
```
