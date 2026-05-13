```csharp
await client.DeleteVectorNameAsync(new()
{
	CollectionName = COLLECTION,
	VectorName = OLD_VECTOR
});
```
