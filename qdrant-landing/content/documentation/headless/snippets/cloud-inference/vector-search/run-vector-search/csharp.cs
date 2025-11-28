

public class Snippet
{
	public static async Task Run()
	{
		await client.QueryAsync(
		collectionName: "{collection_name}", prefetch: new List <PrefetchQuery> {
		  new() {
		    Query = new Document {
		      Text = queryText,
		      Model = bm25Model
		    },
		    Using = "bm25_sparse_vector",
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
		limit: 5
		);
	}
}
