
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide


        var excludeFilter = new Filter
        {
            MustNot = { MatchKeyword("author", "H.G. Wells") }
        };

        await client.QueryAsync(
            collectionName: "books",
            query: new Document { Text = "time travel", Model = "sentence-transformers/all-minilm-l6-v2" },
            usingVector: "description-dense",
            filter: excludeFilter,
            payloadSelector: true
        );

    }
}
