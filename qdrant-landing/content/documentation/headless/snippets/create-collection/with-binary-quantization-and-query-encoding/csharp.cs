using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient("localhost", 6334);
		// @hide-end

		await client.CreateCollectionAsync(
		  collectionName: "{collection_name}",
		  vectorsConfig: new VectorParams { Size = 1536, Distance = Distance.Cosine },
		  quantizationConfig: new QuantizationConfig
		  {
		    Binary = new BinaryQuantization {
		      QueryEncoding = new BinaryQuantizationQueryEncoding
		      {
		        Setting = BinaryQuantizationQueryEncoding.Types.Setting.Scalar8Bits,
		      },
		      Memory = Memory.Pinned
		    }
		  }
		);
	}
}
