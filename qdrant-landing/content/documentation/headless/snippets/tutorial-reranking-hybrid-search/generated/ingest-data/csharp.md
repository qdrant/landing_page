```csharp
string csvUrl = "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv";

int batchSize = 25;
ulong idx = 0;
var buffer = new List<PointStruct>();

await foreach (var (title, author, description) in ParseCsv(csvUrl))
{
	buffer.Add(new PointStruct
	{
		Id = idx++,
		Vectors = new Dictionary<string, Vector>
		{
			["dense"] = new Document { Text = description, Model = denseEmbeddingModel },
			["sparse"] = new Document { Text = description, Model = sparseEmbeddingModel },
			["multi"] = new Document { Text = description, Model = lateInteractionEmbeddingModel },
		},
		Payload = { ["title"] = title, ["author"] = author, ["description"] = description }
	});

	if (buffer.Count >= batchSize)
	{
		await client.UpsertAsync(collectionName: collectionName, points: buffer);
		buffer.Clear();
	}
}

if (buffer.Count > 0)
	await client.UpsertAsync(collectionName: collectionName, points: buffer);
```
