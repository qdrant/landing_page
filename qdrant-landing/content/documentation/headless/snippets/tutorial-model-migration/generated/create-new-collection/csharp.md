```csharp
await client.CreateCollectionAsync(
	collectionName: NEW_COLLECTION,
	vectorsConfig: new VectorParams { Size = 512, Distance = Distance.Cosine }
);
```
