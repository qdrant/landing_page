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

		await client.UpsertAsync(
		    collectionName: "{collection_name}",
		    points: new List<PointStruct>
		    {
		        new()
		        {
		            Id = 1,
		            Vectors = new Document()
		            {
		                Model = "jinaai/jina-clip-v2",
		                Text = "Mission to Mars",
		                Options = { ["jina-api-key"] = "<YOUR_JINAAI_API_KEY>", ["dimensions"] = 512 },
		            },
		        },
		    }
		);
	}
}
