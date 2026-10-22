using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		var queryText = "{query_text}";
		var denseModel = "{dense_model_name}";
		// @hide-end

		var results = await client.QueryAsync(
		collectionName: "{collection_name}", prefetch: new List <PrefetchQuery> {
		  new() {
		    Query = new Query { Text = new TextQuery { Query = queryText } },
		    Using = "passage_text",
		    Limit = 5
		  },
		  new() {
		    Query = new Document {
		      Text = queryText,
		      Model = denseModel
		    },
		    Using = "dense_vector",
		    Limit = 5
		  }
		},
		query: Fusion.Rrf,
		payloadSelector: true,
		limit: 5
		);

		foreach (var point in results)
		{
		  var question = point.Payload["question"].StringValue;
		  Console.WriteLine($"{point.Score:F3}  {question.Trim()}");
		}
	}
}
