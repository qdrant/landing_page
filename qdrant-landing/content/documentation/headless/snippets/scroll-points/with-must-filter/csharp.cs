using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		// & operator combines two conditions in an AND conjunction(must)
		await client.ScrollAsync(
			collectionName: "{collection_name}",
			filter: MatchKeyword("city", "London") & MatchKeyword("color", "red")
		);
	}
}
