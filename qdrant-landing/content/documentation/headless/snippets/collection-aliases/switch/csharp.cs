

public class Snippet
{
	public static async Task Run()
	{
		await client.DeleteAliasAsync("production_collection");
		await client.CreateAliasAsync(aliasName: "production_collection", collectionName: "example_collection");
	}
}
