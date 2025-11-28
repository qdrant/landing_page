using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  vectorsConfig: new VectorParams {
		    Size = 1024, Distance = Distance.Cosine, Datatype = Datatype.Uint8
		  }
		);
	}
}
