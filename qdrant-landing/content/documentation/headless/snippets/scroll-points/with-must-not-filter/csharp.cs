using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		// The ! operator negates the condition(must not)
		await client.ScrollAsync(
			collectionName: "{collection_name}",
			filter: !(MatchKeyword("city", "London") & MatchKeyword("color", "red"))
		);
	}
}
