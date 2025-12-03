using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreatePayloadIndexAsync(
		 collectionName: "{collection_name}",
		 fieldName: "payload_field_name",
		 schemaType: PayloadSchemaType.Keyword,
		 indexParams: new PayloadIndexParams
		 {
		  KeywordIndexParams = new KeywordIndexParams
		  {
		   IsTenant = true
		  }
		 }
		);
	}
}
