using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		var client = new QdrantClient("localhost", 6334);

		await client.CreateCollectionAsync(
			collectionName: "{collection_name}",
			vectorsConfig: new VectorParams { Size = 768, Distance = Distance.Cosine},
			quantizationConfig: new QuantizationConfig
			{
				Scalar = new ScalarQuantization { Type = QuantizationType.Int8, AlwaysRam = true }
			}
		);
	}
}
