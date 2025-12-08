using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
			collectionName: "{collection_name}",
			sparseVectorsConfig: ("splade-model-name", new SparseVectorParams{
		        Index = new SparseIndexConfig {
		            OnDisk = false,
		        }
		    })
		);
	}
}
