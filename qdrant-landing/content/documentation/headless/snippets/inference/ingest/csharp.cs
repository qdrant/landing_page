using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		host: "xyz-example.qdrant.io", port: 6334, https: true, apiKey: "<your-api-key>");

		await client.UpsertAsync(
		    collectionName: "{collection_name}",
		    points: new List<PointStruct>
		    {
		        new()
		        {
		            Id = 1,
		            Vectors = new Dictionary<string, Vector>
		            {
		                ["my-bm25-vector"] = new Document()
		                {
		                    Model = "qdrant/bm25",
		                    Text = "Recipe for baking chocolate chip cookies",
		                },
		            },
		        },
		    }
		);
	}
}
