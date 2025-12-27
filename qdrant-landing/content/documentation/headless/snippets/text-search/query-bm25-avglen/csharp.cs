
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


        await client.QueryAsync(
            collectionName: "books",
            query: new Document
            {
                Text = "time travel",
                Model = "qdrant/bm25",
                Options = { ["avg_len"] = 5.0 }
            },
            usingVector: "title-bm25",
            payloadSelector: true,
            limit: 10
        );

    }
}
