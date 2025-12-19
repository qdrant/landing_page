
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


        await client.QueryAsync(
            collectionName: "books",
            query: new Document { Text = "time travel", Model = "prithivida/splade_pp_en_v1" },
            usingVector: "title-splade",
            payloadSelector: true,
            limit: 10
        );

    } // @hide
} // @hide
