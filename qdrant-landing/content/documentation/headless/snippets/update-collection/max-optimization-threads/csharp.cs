using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.UpdateCollectionAsync(
			collectionName: "{collection_name}",
			optimizersConfig: new OptimizersConfigDiff { MaxOptimizationThreads = new MaxOptimizationThreads { Value = 1 } }
		);
	}
}
