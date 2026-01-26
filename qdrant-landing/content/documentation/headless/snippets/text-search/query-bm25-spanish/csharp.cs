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
                Text = "tiempo",
                Model = "qdrant/bm25",
                Options = { ["language"] = "spanish" },
            },
            usingVector: "title-bm25",
            payloadSelector: true,
            limit: 10
        );
    }
}
