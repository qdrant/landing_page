using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.UpsertAsync(
			collectionName: "{collection_name}",
			points: new List<PointStruct>
			{
				new() { Id = 111, Vectors = new[] { 0.1f, 0.2f, 0.3f } }
			},
			shardKeySelector: new ShardKeySelector { ShardKeys = { new List<ShardKey> { "user_1" } } }
		);
	}
}
