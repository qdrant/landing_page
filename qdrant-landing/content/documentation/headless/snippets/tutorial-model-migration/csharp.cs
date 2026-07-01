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

		string COLLECTION = "my_collection";
		string OLD_VECTOR = "old-model";
		string NEW_VECTOR = "new-model";
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

		// @block-start add-named-vector
		await client.CreateVectorNameAsync(new()
		{
			CollectionName = COLLECTION,
			VectorName = NEW_VECTOR,
			DenseConfig = new() { Size = 512, Distance = Distance.Cosine }
		});
		// @block-end add-named-vector

		// @block-start upsert-both-vectors
		await client.UpsertAsync(
			collectionName: COLLECTION,
			points: new List<PointStruct>
			{
				new()
				{
					Id = 1,
					Vectors = new Dictionary<string, Vector>
					{
						[OLD_VECTOR] = new Document { Text = "Example document", Model = OLD_MODEL },
						[NEW_VECTOR] = new Document { Text = "Example document", Model = NEW_MODEL },
					},
					Payload = { ["text"] = "Example document" }
				}
			}
		);
		// @block-end upsert-both-vectors

		// @block-start re-embed-existing
		PointId? reEmbedLastOffset = null;
		uint reEmbedBatchSize = 100;
		bool reEmbedReachedEnd = false;

		while (!reEmbedReachedEnd)
		{
			var reEmbedScrollResult = await client.ScrollAsync(
				collectionName: COLLECTION,
				limit: reEmbedBatchSize,
				offset: reEmbedLastOffset,
				payloadSelector: true,
				vectorsSelector: false
			);

			var reEmbedRecords = reEmbedScrollResult.Result;
			reEmbedLastOffset = reEmbedScrollResult.NextPageOffset;

			var pointVectors = new List<PointVectors>();
			foreach (var record in reEmbedRecords)
			{
				var text = record.Payload.ContainsKey("text")
					? record.Payload["text"].StringValue
					: "";

				// Update only the new vector on each point; the old vector and payload are untouched
				pointVectors.Add(new PointVectors
				{
					Id = record.Id,
					Vectors = new Dictionary<string, Vector>
					{
						[NEW_VECTOR] = new Document { Text = text, Model = NEW_MODEL }
					}
				});
			}

			await client.UpdateVectorsAsync(collectionName: COLLECTION, points: pointVectors);

			reEmbedReachedEnd = (reEmbedLastOffset == null);
		}
		// @block-end re-embed-existing

		// @block-start search-with-old-vector
		var oldVectorResults = await client.QueryAsync(
			collectionName: COLLECTION,
			query: new Document { Text = "my query", Model = OLD_MODEL },
			usingVector: OLD_VECTOR,
			limit: 10
		);
		// @block-end search-with-old-vector

		// @block-start search-with-new-vector
		var newVectorResults = await client.QueryAsync(
			collectionName: COLLECTION,
			query: new Document { Text = "my query", Model = NEW_MODEL },
			usingVector: NEW_VECTOR,
			limit: 10
		);
		// @block-end search-with-new-vector

		// @block-start delete-old-named-vector
		await client.DeleteVectorNameAsync(new()
		{
			CollectionName = COLLECTION,
			VectorName = OLD_VECTOR
		});
		// @block-end delete-old-named-vector
	}
}
