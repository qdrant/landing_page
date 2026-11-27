```csharp
using Serverless = Qdrant.Client.Grpc.Serverless;

await client.CreateCollectionAsync(
    collectionName: "menu",
    config: new Serverless.CollectionConfig
    {
        DenseVectors =
        {
            ["dense"] = new Serverless.DenseVectorConfig { Size = 384, Distance = Serverless.Distance.Cosine }
        },
        PayloadIndexes =
        {
            ["description"] = new Serverless.TextIndex
            {
                Tokenizer = Serverless.Tokenizer.Word,
                Stopwords = new Serverless.StopwordsSet { Languages = { "english" } },
                Scoring = new Serverless.TextScoringParams { Type = Serverless.TextScoringType.Bm25 }
            }
        }
    }
);
```
