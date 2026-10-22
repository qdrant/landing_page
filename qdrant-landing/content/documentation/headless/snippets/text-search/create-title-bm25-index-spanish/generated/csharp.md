```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreatePayloadIndexAsync(
    collectionName: "books",
    fieldName: "title",
    schemaType: PayloadSchemaType.Text,
    indexParams: new PayloadIndexParams
    {
        TextIndexParams = new TextIndexParams
        {
            Tokenizer = TokenizerType.Word,
            Stemmer = new StemmingAlgorithm
            {
                Snowball = new SnowballParams { Language = "spanish" }
            },
            Stopwords = new StopwordsSet { Languages = { "spanish" } },
            Scoring = new TextScoringParams { Type = TextScoringType.Bm25 }
        }
    }
);
```
