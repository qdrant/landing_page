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
			new CreateCollection
			{
				CollectionName = "{collection_name}",
				VectorsConfig = new VectorsConfig
				{
					Params = new VectorParams { Size = 768, Distance = Distance.Cosine, Memory = Memory.Cached }
				},
				HnswConfig = new HnswConfigDiff { Memory = Memory.Cold },
				QuantizationConfig = new QuantizationConfig
				{
					Scalar = new ScalarQuantization { Type = QuantizationType.Int8, Memory = Memory.Pinned }
				},
				Payload = new PayloadStorageParams { Memory = Memory.Cached },
				IdTracker = new IdTrackerParams { Memory = Memory.Cached }
			}
		);
	}
}
