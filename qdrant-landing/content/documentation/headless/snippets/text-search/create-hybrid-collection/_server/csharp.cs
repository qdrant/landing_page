using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

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
            }
        );

        await client.CreatePayloadIndexAsync(
            collectionName: "books",
            fieldName: "title",
            schemaType: PayloadSchemaType.Text,
            indexParams: new PayloadIndexParams
            {
                TextIndexParams = new TextIndexParams
                {
                    Tokenizer = TokenizerType.Word,
                    Scoring = new TextScoringParams { Type = TextScoringType.Bm25 },
                },
            }
        );
    }
}
