
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
            query: new Document
            {
                Text = "Mieville",
                Model = "qdrant/bm25",
                Options =
                {
                    ["language"] = "none",
                    ["tokenizer"] = "multilingual",
                    ["ascii_folding"] = true
                }
            },
            usingVector: "author-bm25",
            payloadSelector: true,
            limit: 10
        );

    } // @hide
} // @hide
