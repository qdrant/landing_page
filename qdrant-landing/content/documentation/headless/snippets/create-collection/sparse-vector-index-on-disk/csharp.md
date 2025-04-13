```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

var client = new QdrantClient("localhost", 6334);

await client.CreateCollectionAsync(
	collectionName: "{collection_name}",
	sparseVectorsConfig: ("splade-model-name", new SparseVectorParams{
        Index = new SparseIndexConfig {
            OnDisk = false,
        }
    })
);
```
