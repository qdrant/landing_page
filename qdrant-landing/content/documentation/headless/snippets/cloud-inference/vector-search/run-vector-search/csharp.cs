using Qdrant.Client; // @hide
using Qdrant.Client.Grpc; // @hide

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		var queryText = "{query_text}";
		var denseModel = "{dense_model_name}";
		var bm25Model = "{bm25_model_name}";
		// @hide-end

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
