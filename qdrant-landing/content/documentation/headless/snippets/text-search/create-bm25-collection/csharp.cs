
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


        await client.CreateCollectionAsync(
            collectionName: "books",
            sparseVectorsConfig: ("title-bm25", new SparseVectorParams { Modifier = Modifier.Idf })
        );

    } // @hide
} // @hide
