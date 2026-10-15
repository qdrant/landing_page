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
            Scoring = new TextScoringParams { Type = TextScoringType.Bm25 }
        }
    }
);
```
