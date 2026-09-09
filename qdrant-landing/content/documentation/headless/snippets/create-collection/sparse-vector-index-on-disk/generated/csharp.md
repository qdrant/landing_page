```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	sparseVectorsConfig: ("text", new SparseVectorParams{
        Index = new SparseIndexConfig {
            Memory = Memory.Cold,
        }
    })
);
```
