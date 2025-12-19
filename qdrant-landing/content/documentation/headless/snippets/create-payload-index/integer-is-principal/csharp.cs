using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreatePayloadIndexAsync(
		 collectionName: "{collection_name}",
		 fieldName: "timestamp",
		 schemaType: PayloadSchemaType.Integer,
		 indexParams: new PayloadIndexParams
		 {
		  IntegerIndexParams = new IntegerIndexParams
		  {
		   IsPrincipal = true
		  }
		 }
		);
	}
}
