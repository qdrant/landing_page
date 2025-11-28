using Qdrant.Client;
using Qdrant.Client.Grpc;
using Value = Qdrant.Client.Grpc.Value;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(
		  host: "xyz-example.qdrant.io",
		  port: 6334,
		  https: true,
		  apiKey: "<paste-your-api-key-here>"
		);

		await client.UpsertAsync(
		  collectionName: "<your-collection>",
		  points: new List <PointStruct> {
		    new() {
		      Id = 1,
		        Vectors = new Document() {
		          Text = "Recipe for baking chocolate chip cookies",
		          Model = "<the-model-to-use>",
		        },
		        Payload = {
		          ["topic"] = "cooking",
		          ["type"] = "dessert"
		        },
		    },
		  }
		);

		var points = await client.QueryAsync(
		  collectionName: "<your-collection>",
		  query: new Document() {
		    Text = "How to bake cookies?",
		    Model = "<the-model-to-use>"
		  }
		);

		foreach(var point in points) {
		  Console.WriteLine(point);
		}
	}
}
