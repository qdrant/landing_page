using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.CreatePayloadIndexAsync(
		 collectionName: "{collection_name}",
		 fieldName: "offers[].shop",
		 schemaType: PayloadSchemaType.Keyword,
		 indexParams: new PayloadIndexParams
		 {
		  KeywordIndexParams = new KeywordIndexParams { Nested = "offers" }
		 }
		);

		await client.CreatePayloadIndexAsync(
		 collectionName: "{collection_name}",
		 fieldName: "offers[].price",
		 schemaType: PayloadSchemaType.Float,
		 indexParams: new PayloadIndexParams
		 {
		  FloatIndexParams = new FloatIndexParams { Nested = "offers" }
		 }
		);
	}
}
