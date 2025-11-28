

public class Snippet
{
	public static async Task Run()
	{
		await client.DeleteAliasAsync("production_collection");
	}
}
