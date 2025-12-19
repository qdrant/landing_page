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
				new()
				{
					Id = 1,
					Vectors = new[] { 0.9f, 0.1f, 0.1f },
					Payload = { ["group_id"] = "user_1" }
				}
			},
			shardKeySelector: new ShardKeySelector { 
				ShardKeys = { new List<ShardKey> { "user_1" } },
				Fallback = new ShardKey { Keyword = "default" }
			}
		);
	}
}
