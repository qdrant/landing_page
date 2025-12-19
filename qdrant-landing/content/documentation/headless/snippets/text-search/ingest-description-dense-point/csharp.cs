
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
                        ["description-dense"] = new Document
                        {
                            Text = "A Victorian scientist builds a device to travel far into the future and observes the dim trajectories of humanity. He discovers evolutionary divergence and the consequences of class division. Wells's novella established time travel as a vehicle for social commentary.",
                            Model = "sentence-transformers/all-minilm-l6-v2"
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
