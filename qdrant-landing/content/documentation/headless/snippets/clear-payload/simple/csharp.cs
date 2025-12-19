using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.ClearPayloadAsync(collectionName: "{collection_name}", ids: new ulong[] { 0, 3, 100 });
	}
}
