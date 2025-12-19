using Qdrant.Client; // @hide
using Qdrant.Client.Grpc; // @hide

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide
		await client.CreateAliasAsync(aliasName: "production_collection", collectionName: "example_collection");
	}
}
