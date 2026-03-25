```csharp
string COLLECTION_NAME = "my_books";

await client.CreateCollectionAsync(
	collectionName: COLLECTION_NAME,
	vectorsConfig: new VectorParams { Size = 384, Distance = Distance.Cosine }
);
```
