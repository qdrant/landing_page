
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


        var searchStrict = new QueryPoints
        {
            CollectionName = "books",
            Query = new Document { Text = "time travel", Model = "sentence-transformers/all-minilm-l6-v2" },
            Using = "description-dense",
            Filter = new Filter { Must = { MatchText("title", "time travel") } }
        };

        var searchRelaxed = new QueryPoints
        {
            CollectionName = "books",
            Query = new Document { Text = "time travel", Model = "sentence-transformers/all-minilm-l6-v2" },
            Using = "description-dense",
            Filter = new Filter { Must = { MatchTextAny("title", "time travel") } }
        };

        var searchVectorOnly = new QueryPoints
        {
            CollectionName = "books",
            Query = new Document { Text = "time travel", Model = "sentence-transformers/all-minilm-l6-v2" },
            Using = "description-dense"
        };

        await client.QueryBatchAsync(
            collectionName: "books",
            queries: new List<QueryPoints> { searchStrict, searchRelaxed, searchVectorOnly }
        );

    } // @hide
} // @hide
