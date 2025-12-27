
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


        await client.CreateCollectionAsync(
            collectionName: "books",
            vectorsConfig: new VectorParamsMap
            {
                Map = { ["description-dense"] = new VectorParams { Size = 384, Distance = Distance.Cosine } }
            },
            sparseVectorsConfig: new SparseVectorConfig
            {
                Map = { ["isbn-bm25"] = new SparseVectorParams { Modifier = Modifier.Idf } }
            }
        );

    }
}
