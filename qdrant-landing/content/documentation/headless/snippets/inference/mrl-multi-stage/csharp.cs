using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		    host: "xyz-example.qdrant.io",
		    port: 6334,
		    https: true,
		    apiKey: "<your-api-key>"
		);

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    prefetch:
		    [
		        new()
		        {
		            Query = new Document()
		            {
		                Model = "openai/text-embedding-3-small",
		                Text = "How to bake cookies?",
		                Options = { ["openai-api-key"] = "<YOUR_OPENAI_API_KEY>", ["mrl"] = 64 },
		            },
		            Using = "small",
		            Limit = 1000,
		        },
		    ],
		    query: new Document()
		    {
		        Model = "openai/text-embedding-3-small",
		        Text = "How to bake cookies?",
		        Options = { ["openai-api-key"] = "<YOUR_OPENAI_API_KEY>" },
		    },
		    usingVector: "large",
		    limit: 10
		);
	}
}
