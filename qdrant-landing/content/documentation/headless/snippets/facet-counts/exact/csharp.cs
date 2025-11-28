using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		await client.FacetAsync(
		    "{collection_name}",
		    key: "size",
		    exact: true,
		);
	}
}
