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
				Turboquant = new TurboQuantization { Memory = Memory.Pinned, Bits = TurboQuantBitSize.Bits2 }
			}
		);
	}
}
