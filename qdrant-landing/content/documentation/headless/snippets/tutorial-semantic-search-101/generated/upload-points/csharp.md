```csharp
string EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2";

var points = new List<PointStruct>();

for (ulong idx = 0; idx < (ulong)payloads.Count; idx++)
{
	var payload = payloads[(int)idx];
	string description = payload["description"].StringValue;

	var point = new PointStruct
	{
		Id = idx,
		Vectors = new Document
		{
			Text = description,
			Model = EMBEDDING_MODEL
		},
		Payload = { payload }
	};

	points.Add(point);
}

await client.UpsertAsync(
	collectionName: COLLECTION_NAME,
	points: points
);
```
