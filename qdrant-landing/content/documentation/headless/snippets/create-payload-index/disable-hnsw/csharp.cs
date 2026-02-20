using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreatePayloadIndexAsync(
		 collectionName: "{collection_name}",
		 fieldName: "name_of_the_field_to_index",
		 schemaType: PayloadSchemaType.Keyword,
		 indexParams: new PayloadIndexParams
		 {
		  KeywordIndexParams = new KeywordIndexParams
		  {
		   EnableHnsw = false
		  }
		 }
		);
	}
}
