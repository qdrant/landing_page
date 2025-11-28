using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  strictModeConfig: new StrictModeConfig { enabled = true, max_collection_vector_size_bytes = 1000000, max_collection_payload_size_bytes = 1000000 }
		);
	}
}
