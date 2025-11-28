using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide
		await client.FacetAsync(
		    "{collection_name}",
		    key: "size",
		    exact: true
		);
	}
}
