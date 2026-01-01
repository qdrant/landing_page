```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
    collectionName: "books",
    vectorsConfig: new VectorParamsMap
    {
        Map =
        {
            ["description-dense"] = new VectorParams
            {
                Size = 384,
                Distance = Distance.Cosine,
            },
        },
    },
    sparseVectorsConfig: new SparseVectorConfig
    {
        Map = { ["isbn-bm25"] = new SparseVectorParams { Modifier = Modifier.Idf } },
    }
);
```
