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
		    SparseConfig = new StrictModeSparseConfig
		    {
		      SparseConfig = { ["{vector_name}"] = new StrictModeSparse { MaxLength = 1000 } }
		    }
		  }
		);
	}
}
