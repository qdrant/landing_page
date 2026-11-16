using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "{collection_name}",
            prefetch: new List<PrefetchQuery>
            {
                new()
                {
                    Query = new Query { Text = new TextQuery { Query = "time travel" } },
                    Using = "title",
                    Limit = 100,
                },
            },
            query: new float[] { 0.01f, 0.45f, 0.67f },
            usingVector: "dense",
            limit: 10
        );
    }
}
