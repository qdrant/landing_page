using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Document
            {
                Text = "村上春樹",
                Model = "qdrant/bm25",
                Options = { ["tokenizer"] = "multilingual" },
            },
            usingVector: "author-bm25",
            payloadSelector: true,
            limit: 10
        );
    }
}
