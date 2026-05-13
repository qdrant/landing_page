```csharp
using Qdrant.Client;
using Qdrant.Client.Grpc;

await client.CreateCollectionAsync(
	collectionName: NEW_COLLECTION,
	vectorsConfig: new VectorParams { Size = 512, Distance = Distance.Cosine }
);

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

var results = await client.QueryAsync(
	collectionName: OLD_COLLECTION,
	query: new Document
	{
		Text = "my query",
		Model = OLD_MODEL
	},
	limit: 10
);

results = await client.QueryAsync(
	collectionName: NEW_COLLECTION,
	query: new Document
	{
		Text = "my query",
		Model = NEW_MODEL
	},
	limit: 10
);

await client.CreateVectorNameAsync(new()
{
	CollectionName = COLLECTION,
	VectorName = NEW_VECTOR,
	DenseConfig = new() { Size = 512, Distance = Distance.Cosine }
});

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

var oldVectorResults = await client.QueryAsync(
	collectionName: COLLECTION,
	query: new Document { Text = "my query", Model = OLD_MODEL },
	usingVector: OLD_VECTOR,
	limit: 10
);

var newVectorResults = await client.QueryAsync(
	collectionName: COLLECTION,
	query: new Document { Text = "my query", Model = NEW_MODEL },
	usingVector: NEW_VECTOR,
	limit: 10
);

await client.DeleteVectorNameAsync(new()
{
	CollectionName = COLLECTION,
	VectorName = OLD_VECTOR
});
```
