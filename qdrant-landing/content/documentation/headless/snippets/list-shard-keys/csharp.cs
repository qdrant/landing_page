using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.ListShardKeysAsync("{collection_name}");
	}
}
