using Qdrant.Client;
using static Qdrant.Client.Grpc.Conditions;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		ulong[] seenIds = [83461, 19284, 57392, 44017, 91825]; // IDs returned on previous pages

		// The ! operator negates the condition (must not)
		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
		    filter: !HasId(seenIds),
		    limit: 5
		);
	}
}
