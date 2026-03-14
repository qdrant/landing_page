using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		host: "xyz-example.qdrant.io", port: 6334, https: true, apiKey: "<your-openrouter-key>");

		await client.UpsertAsync(
		    collectionName: "{collection_name}",
		    points: new List<PointStruct>
		    {
		        new()
		        {
		            Id = 1,
		            Vectors = new Document()
		            {
		                Model = "openrouter/mistralai/mistral-embed-2312",
		                Text = "Recipe for baking chocolate chip cookies",
		                Options = { ["openrouter-api-key"] = "<YOUR_OPENROUTER_API_KEY>" },
		            },
		        },
		    }
		);
	}
}
