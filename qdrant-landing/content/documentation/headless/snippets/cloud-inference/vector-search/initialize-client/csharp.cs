using Qdrant.Client;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		  host: "xyz-example.cloud-region.cloud-provider.cloud.qdrant.io",
		  https: true,
		  apiKey: "<paste-your-api-key-here>"
		);
	}
}
