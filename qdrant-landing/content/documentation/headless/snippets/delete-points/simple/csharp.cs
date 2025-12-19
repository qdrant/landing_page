using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.DeleteAsync(collectionName: "{collection_name}", ids: (ulong[])[0, 3, 100]);
	}
}
