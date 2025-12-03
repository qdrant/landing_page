using Qdrant.Client;
using Qdrant.Client.Grpc;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.SetPayloadAsync(
		    collectionName: "{collection_name}",
		    payload: new Dictionary<string, Value> { { "property1", "string" }, { "property2", "string" } },
		    filter: MatchKeyword("color", "red")
		);
	}
}
