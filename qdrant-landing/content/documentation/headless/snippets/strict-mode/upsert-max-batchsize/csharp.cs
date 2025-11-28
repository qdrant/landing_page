using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  strictModeConfig: new StrictModeConfig { enabled = true, upsert_max_batchsize = 1000 }
		);
	}
}
