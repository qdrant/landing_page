using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
    public static async Task Run()
    {
        var client = new QdrantClient("localhost", 6334); // @hide

        await client.CreateCollectionAsync(
            collectionName: "books",
            sparseVectorsConfig: ("title-bm25", new SparseVectorParams { Modifier = Modifier.Idf })
        );
    }
}
