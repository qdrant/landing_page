

public class Snippet
{
	public static async Task Run()
	{
		await client.ScrollAsync("{collection_name}", limit: 15, orderBy: "timestamp");
	}
}
