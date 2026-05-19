using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.QueryGroupsAsync(
		    collectionName: "chunks",
		    groupBy: "document_id",
		    query: new float[] { 0.2f, 0.1f, 0.9f, 0.7f },
		    limit: 2,
		    groupSize: 2,
		    withLookup: new WithLookup
		    {
		        Collection = "documents",
		        WithPayload = new WithPayloadSelector
		        {
		            Include = new PayloadIncludeSelector { Fields = { new string[] { "title", "text" } } }
		        },
		        WithVectors = false
		    }
		);
	}
}
