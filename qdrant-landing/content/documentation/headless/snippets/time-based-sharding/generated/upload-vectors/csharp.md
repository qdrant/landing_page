```csharp
string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/time-based-sharding/social-media-posts.csv";

var existingShardKeys = (await client.ListShardKeysAsync(collectionName))
	.Select(sk => sk.Key.Keyword)
	.ToHashSet();

string denseModel = "sentence-transformers/all-MiniLM-L6-v2";
int batchSize = 100;
string? currentDate = null;
var buffer = new List<PointStruct>();

using var httpClient = new HttpClient();
using var stream = await httpClient.GetStreamAsync(csvUrl);
using var parser = new TextFieldParser(new StreamReader(stream));
parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
parser.SetDelimiters(",");

string[]? headers = parser.ReadFields();
int textIdx = Array.IndexOf(headers!, "text");
int datetimeIdx = Array.IndexOf(headers!, "datetime");

while (!parser.EndOfData)
{
	var fields = parser.ReadFields()!;
	string text = fields[textIdx];
	string datetime = fields[datetimeIdx];
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

	buffer.Add(new PointStruct
	{
		Id = Guid.NewGuid(),
		Vectors = new Dictionary<string, Vector>
		{
			["dense_vector"] = new Document { Text = text, Model = denseModel }
		},
		Payload = { ["text"] = text, ["datetime"] = datetime }
	});

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
