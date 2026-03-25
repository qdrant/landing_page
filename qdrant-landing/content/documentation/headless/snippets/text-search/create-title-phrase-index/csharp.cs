using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.CreatePayloadIndexAsync(
            collectionName: "books",
            fieldName: "title",
            schemaType: PayloadSchemaType.Text,
            indexParams: new PayloadIndexParams
            {
                TextIndexParams = new TextIndexParams
                {
                    Tokenizer = TokenizerType.Word,
                    AsciiFolding = true,
                    PhraseMatching = true,
                    Lowercase = true,
                },
            }
        );
    }
}
