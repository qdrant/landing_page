using Qdrant.Client;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334);

        using (RequestHeaders.Use("x-request-id", "my-trace-id"))
            await client.ListCollectionsAsync();
    }
}
