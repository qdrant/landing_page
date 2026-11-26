using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient(host: "xyz-example.qdrant.io", port: 6334, https: true, apiKey: "<your-api-key>"); // @hide

		var queryText = "vegetarian dishes";

		var results = await client.QueryAsync(
			collectionName: "items",
			query: new Document
			{
				Text = queryText,
				Model = "sentence-transformers/all-MiniLM-L6-v2",
			},
			payloadSelector: true,
			limit: 5
		);

		foreach (var result in results)
		{
			Console.WriteLine($"Item: {result.Payload["item_name"].StringValue}");
			Console.WriteLine($"Score: {result.Score}");
			Console.WriteLine($"Description: {result.Payload["description"].StringValue}");
			Console.WriteLine($"Price: {result.Payload["price"].StringValue}");
			Console.WriteLine("---");
		}
	}
}
