using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.DeletePayloadAsync(
		    collectionName: "{collection_name}",
		    keys: ["color", "price"],
		    ids: new ulong[] { 0, 3, 100 }
		);
	}
}
