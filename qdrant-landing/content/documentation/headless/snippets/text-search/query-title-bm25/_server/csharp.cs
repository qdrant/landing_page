using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Query { Text = new TextQuery { Query = "time travel" } },
            usingVector: "title",
            payloadSelector: true,
            limit: 10
        );
    }
}
