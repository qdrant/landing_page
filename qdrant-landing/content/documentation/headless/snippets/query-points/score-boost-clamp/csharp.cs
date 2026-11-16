using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.QueryAsync(
		    collectionName: "{collection_name}",
		    prefetch:
		    [
		        new PrefetchQuery { Query = new float[] { 0.01f, 0.45f, 0.67f }, Limit = 100 },
		    ],
		    query: new Formula
		    {
		        Expression = new SumExpression
		        {
		            Sum =
		            {
		                "$score",
		                // clamp `rating` into the range [0, 1]
		                new MaxExpression
		                {
		                    Max = { 0.0f, new MinExpression { Min = { 1.0f, "rating" } } },
		                },
		            },
		        },
		    },
		    limit: 10
		);
	}
}
