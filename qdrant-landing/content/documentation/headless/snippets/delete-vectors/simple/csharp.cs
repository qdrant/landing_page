

public class Snippet
{
	public static async Task Run()
	{
		await client.DeleteVectorsAsync("{collection_name}", ["text", "image"], [0, 3, 10]);
	}
}
