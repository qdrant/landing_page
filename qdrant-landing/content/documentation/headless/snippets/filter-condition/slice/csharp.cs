using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.ScrollAsync(collectionName: "{collection_name}", filter: Slice(3, 8));
	}
}
