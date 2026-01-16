```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
    collectionName: "books",
    sparseVectorsConfig: ("title-bm25", new SparseVectorParams { Modifier = Modifier.Idf })
);
```
