
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


        await client.UpsertAsync(
            collectionName: "books",
            wait: true,
            points: new List<PointStruct>
            {
                new()
                {
                    Id = 1,
                    Vectors = new Dictionary<string, Vector>
                    {
                        ["title-bm25"] = new Document
                        {
                            Text = "The Time Machine",
                            Model = "qdrant/bm25"
                        }
                    },
                    Payload =
                    {
                        ["title"] = "The Time Machine",
                        ["author"] = "H.G. Wells",
                        ["isbn"] = "9780553213515"
                    }
                }
            }
        );

    }
}
