using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Document { Text = "time travel", Model = "prithivida/splade_pp_en_v1" },
            usingVector: "title-splade",
            payloadSelector: true,
            limit: 10
        );
    }
}
