using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.CreateShardKeyAsync(
		    "{collection_name}",
		    new CreateShardKey { ShardKey = new ShardKey { Keyword = "{shard_key}", } }
		    );
	}
}
