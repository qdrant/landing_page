using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.UpdateCollectionAsync(
			collectionName: "{collection_name}",
			optimizersConfig: new OptimizersConfigDiff { IndexingThreshold = 10000 },
			metadata: new()
			{
				["my-metadata-field"] = new Dictionary<string, Value>
				{
					["key-a"] = "value-a",
					["key-b"] = 42
				},
			}
		);
	}
}
