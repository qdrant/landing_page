```csharp
string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

// Retrieve a list of existing shard keys in the collection
var existingShardKeys = (await client.ListShardKeysAsync(collectionName))
	.Select(sk => sk.Key.Keyword)
	.ToHashSet();

string denseModel = "sentence-transformers/all-MiniLM-L6-v2";
int batchSize = 100;
string? currentDate = null;
var buffer = new List<PointStruct>();

await foreach (var (text, datetime) in ParseCsv(csvUrl))
{
	string shardDate = datetime[..10]; // Extract YYYY-MM-DD

	if (shardDate != currentDate)
	{
		// Flush buffer for the previous date before switching
		if (buffer.Count > 0)
		{
			await client.UpsertAsync(
				collectionName: collectionName,
				points: buffer,
				shardKeySelector: new ShardKeySelector
				{
					ShardKeys = { new List<ShardKey> { currentDate! } }
				}
			);
			buffer.Clear();
		}

		// Create shard for the new date if it doesn't exist yet
		if (!existingShardKeys.Contains(shardDate))
		{
			await client.CreateShardKeyAsync(
				collectionName,
				new CreateShardKey { ShardKey = new ShardKey { Keyword = shardDate } }
			);
			existingShardKeys.Add(shardDate);
		}

		currentDate = shardDate;
	}

	// Add point to buffer
	buffer.Add(new PointStruct
	{
		Id = Guid.NewGuid(),
		Vectors = new Dictionary<string, Vector>
		{
			["dense_vector"] = new Document { Text = text, Model = denseModel }
		},
		Payload = { ["text"] = text, ["datetime"] = datetime }
	});

	// Flush batch if buffer size exceeds batch size
	if (buffer.Count >= batchSize)
	{
		await client.UpsertAsync(
			collectionName: collectionName,
			points: buffer,
			shardKeySelector: new ShardKeySelector
			{
				ShardKeys = { new List<ShardKey> { currentDate! } }
			}
		);
		buffer.Clear();
	}
}

// Flush remaining partial batch
if (buffer.Count > 0)
{
	await client.UpsertAsync(
		collectionName: collectionName,
		points: buffer,
		shardKeySelector: new ShardKeySelector
		{
			ShardKeys = { new List<ShardKey> { currentDate! } }
		}
	);
}
```
