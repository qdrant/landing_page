using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  strictModeConfig: new StrictModeConfig
		  {
		    Enabled = true,
		    MultivectorConfig = new StrictModeMultivectorConfig
		    {
		      MultivectorConfig = { ["{vector_name}"] = new StrictModeMultivector { MaxVectors = 10 } }
		    }
		  }
		);
	}
}
