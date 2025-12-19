using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.DeletePayloadAsync(
		    collectionName: "{collection_name}",
		    keys: ["color", "price"],
		    filter: MatchKeyword("color", "red")
		);
	}
}
