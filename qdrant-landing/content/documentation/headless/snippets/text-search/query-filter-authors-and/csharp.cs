
using System.Collections.Generic;
using System.Threading.Tasks;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet // @hide
{ // @hide
    public static async Task Run() // @hide
    { // @hide
        var client = new QdrantClient("localhost", 6334); // @hide


        var andFilter = new Filter
        {
            Must = { MatchKeyword("author", "Larry Niven"), MatchKeyword("author", "Jerry Pournelle") }
        };

        await client.QueryAsync(
            collectionName: "books",
            query: new Document { Text = "space opera", Model = "sentence-transformers/all-minilm-l6-v2" },
            usingVector: "description-dense",
            filter: andFilter,
            payloadSelector: true
        );

    } // @hide
} // @hide
