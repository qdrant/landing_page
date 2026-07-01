using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient(
		    host: "xyz-example.qdrant.io",
		    port: 6334,
		    https: true,
		    apiKey: "<your-api-key>"
		);
		// @hide-end

		using (RequestHeaders.Use("openai-api-key", "<YOUR_OPENAI_API_KEY>"))
		    await client.UpsertAsync(
		        collectionName: "{collection_name}",
		        points: new List<PointStruct>
		        {
		            new()
		            {
		                Id = 1,
		                Vectors = new Dictionary<string, Vector>
		                {
		                    ["large"] = new Document()
		                    {
		                        Model = "openai/text-embedding-3-small",
		                        Text = "Recipe for baking chocolate chip cookies",
		                    },
		                    ["small"] = new Document()
		                    {
		                        Model = "openai/text-embedding-3-small",
		                        Text = "Recipe for baking chocolate chip cookies",
		                        Options = { ["mrl"] = 64 },
		                    },
		                },
		            },
		        }
		    );
	}
}
