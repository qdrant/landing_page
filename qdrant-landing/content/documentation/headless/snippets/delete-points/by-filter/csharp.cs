using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.DeleteAsync(collectionName: "{collection_name}", filter: MatchKeyword("color", "red"));
	}
}
