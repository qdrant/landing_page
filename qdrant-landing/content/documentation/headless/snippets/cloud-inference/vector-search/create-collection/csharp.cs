

public class Snippet
{
	public static async Task Run()
	{
		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  vectorsConfig: new VectorParamsMap
		  {
		      Map = {
		      ["dense_vector"] = new VectorParams {
		        Size = 384, Distance = Distance.Cosine
		      },
		    }
		  },
		  sparseVectorsConfig: new SparseVectorConfig
		  {
		      Map = {
		        ["bm25_sparse_vector"] = new() {
		    	  Modifier = Modifier.Idf,  // Enable Inverse Document Frequency
		  		}
		    }
		  }
		);
	}
}
