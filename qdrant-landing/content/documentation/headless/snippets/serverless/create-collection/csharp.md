```csharp
using Serverless = Qdrant.Client.Grpc.Serverless;

await client.CreateCollectionAsync(
    collectionName: "products",
    config: new Serverless.CollectionConfig
    {
        DenseVectors =
        {
            ["dense"] = new Serverless.DenseVectorConfig
            {
                Size = 1536,
                Distance = Serverless.Distance.Cosine,
                PrecisionTier = Serverless.PrecisionTier.Medium
            }
        },
        SparseVectors = { ["bm25"] = new Serverless.SparseVectorConfig { UseIdf = true } },
        PayloadIndexes =
        {
            ["category"] = new Serverless.KeywordIndex(),
            ["price"] = new Serverless.FloatIndex()
        }
    }
);
```
