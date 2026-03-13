using Qdrant.Client;
using Qdrant.Client.Grpc;

public class Snippet
{
	public static async Task Run()
	{
		// @hide-start
		var client = new QdrantClient(
			host: "",
			port: 6334,
			https: true,
			apiKey: ""
		);

		string NEW_COLLECTION = "new_collection";
		string OLD_COLLECTION = "old_collection";

		string OLD_MODEL = "sentence-transformers/all-minilm-l6-v2";
		string NEW_MODEL = "qdrant/clip-vit-b-32-text";
		// @hide-end

		// @block-start create-new-collection
		await client.CreateCollectionAsync(
			collectionName: NEW_COLLECTION,
			vectorsConfig: new VectorParams { Size = 512, Distance = Distance.Cosine }
		);
		// @block-end create-new-collection

		// @block-start upsert-old-collection
		await client.UpsertAsync(
			collectionName: OLD_COLLECTION,
			points: new List<PointStruct>
			{
				new()
				{
					Id = 1,
					Vectors = new Document
					{
						Text = "Example document",
						Model = OLD_MODEL
					},
					Payload = { ["text"] = "Example document" }
				}
			}
		);
		// @block-end upsert-old-collection

		// @block-start upsert-new-collection
		await client.UpsertAsync(
			collectionName: NEW_COLLECTION,
			points: new List<PointStruct>
			{
				new()
				{
					Id = 1,
					// Use the new embedding model to encode the document
					Vectors = new Document
					{
						Text = "Example document",
						Model = NEW_MODEL
					},
					Payload = { ["text"] = "Example document" }
				}
			}
		);
		// @block-end upsert-new-collection

		// @block-start migrate-points
		PointId? lastOffset = null;
		uint limit = 100; // Number of points to read in each batch
		bool reachedEnd = false;

		while (!reachedEnd)
		{
			// Get the next batch of points from the old collection
			var scrollResult = await client.ScrollAsync(
				collectionName: OLD_COLLECTION,
				limit: limit,
				offset: lastOffset,
				// Include payloads in the response, as we need them to re-embed the vectors
				payloadSelector: true,
				// We don't need the old vectors, so let's save on the bandwidth
				vectorsSelector: false
			);

			var records = scrollResult.Result;
			lastOffset = scrollResult.NextPageOffset;

			// Re-embed the points using the new model
			var points = new List<PointStruct>();
			foreach (var record in records)
			{
				var text = record.Payload.ContainsKey("text")
					? record.Payload["text"].StringValue
					: "";

				points.Add(new PointStruct
				{
					// Keep the original ID to ensure consistency
					Id = record.Id,
					// Use the new embedding model to encode the text from the payload,
					// assuming that was the original source of the embedding
					Vectors = new Document
					{
						Text = text,
						Model = NEW_MODEL
					},
					// Keep the original payload
					Payload = { record.Payload }
				});
			}

			// Upsert the re-embedded points into the new collection
			await client.UpsertAsync(
				new()
				{
					CollectionName = NEW_COLLECTION,
					Points = { points },
					// Only insert the point if a point with this ID does not already exist.
					UpdateMode = UpdateMode.InsertOnly
				}
			);

			// Check if we reached the end of the collection
			reachedEnd = (lastOffset == null);
		}
		// @block-end migrate-points

		// @block-start search-old-collection
		var results = await client.QueryAsync(
			collectionName: OLD_COLLECTION,
			query: new Document
			{
				Text = "my query",
				Model = OLD_MODEL
			},
			limit: 10
		);
		// @block-end search-old-collection

		// @block-start search-new-collection
		results = await client.QueryAsync(
			collectionName: NEW_COLLECTION,
			query: new Document
			{
				Text = "my query",
				Model = NEW_MODEL
			},
			limit: 10
		);
		// @block-end search-new-collection
	}
}
