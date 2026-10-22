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
		                new MinExpression
		                {
		                    Min =
		                    {
		                        2.0f, // the boost can't exceed this value
		                        new MultExpression { Mult = { 0.1f, "log_views" } },
		                    },
		                },
		            },
		        },
		    },
		    limit: 10
		);
	}
}
