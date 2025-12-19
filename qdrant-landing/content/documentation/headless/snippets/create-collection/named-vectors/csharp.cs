using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  vectorsConfig: new VectorParamsMap
		  {
		      Map = {
		      ["image"] = new VectorParams {
		        Size = 4, Distance = Distance.Dot
		      },
		      ["text"] = new VectorParams {
		        Size = 5, Distance = Distance.Cosine
		      },
		    }
		  },
		  sparseVectorsConfig: new SparseVectorConfig
		  {
		      Map = {
		        ["text-sparse"] = new()
		    }
		  }
		);
	}
}
