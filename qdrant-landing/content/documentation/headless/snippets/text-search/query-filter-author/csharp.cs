using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.QueryAsync(
            collectionName: "books",
            query: new Document
            {
                Text = "time travel",
                Model = "sentence-transformers/all-minilm-l6-v2",
            },
            usingVector: "description-dense",
            filter: MatchKeyword("author", "H.G. Wells"),
            payloadSelector: true
        );
    }
}
