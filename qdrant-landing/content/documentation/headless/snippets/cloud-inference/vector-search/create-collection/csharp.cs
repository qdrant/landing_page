using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  vectorsConfig: new VectorParamsMap
		  {
		      Map = {
		      ["dense_vector"] = new VectorParams {
		        Size = 384, Distance = Distance.Cosine
		      },
		    }
		  }
		);

		await client.CreatePayloadIndexAsync(
		  collectionName: "{collection_name}",
		  fieldName: "passage_text",
		  schemaType: PayloadSchemaType.Text,
		  indexParams: new PayloadIndexParams
		  {
		      TextIndexParams = new TextIndexParams
		      {
		          Tokenizer = TokenizerType.Word,
		          // Enable BM25 scoring
		          Scoring = new TextScoringParams { Type = TextScoringType.Bm25 }
		      }
		  }
		);
	}
}
