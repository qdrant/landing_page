using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Query
            {
                Text = new TextQuery
                {
                    Query = "time travel",
                    Bm25 = new Bm25Params { K = 1.5f, B = 0.5f }
                }
            },
            usingVector: "title",
            payloadSelector: true,
            limit: 10
        );
    }
}
