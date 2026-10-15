using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334); // @hide

		var denseModel = "sentence-transformers/all-minilm-l6-v2";
		// NOTE: LoadDataset is a user-defined function.
		// Implement it to handle dataset loading as needed.
		// @hide-start
		List<Dictionary<string, object>> LoadDataset(string path, string slice)
		{
		    return new List<Dictionary<string, object>> {};
		}
		// @hide-end
		var dataset = LoadDataset("miriad/miriad-4.4M", "train[0:100]");
		var points = new List<PointStruct>();

		foreach (var item in dataset)
		{
		    var passage = item["passage_text"].ToString();

		    var point = new PointStruct
		    {
		        Id = Guid.NewGuid(),
		        Vectors = new Dictionary<string, Vector>
		        {
		            ["dense_vector"] = new Document
		            {
		                Text = passage,
		                Model = denseModel
		            }
		        },
		        // Used for BM25
		        Payload = { ["passage_text"] = passage }
		    };

		    points.Add(point);
		}

		await client.UpsertAsync(
		    collectionName: "{collection_name}",
		    points: points
		);
	}
}
