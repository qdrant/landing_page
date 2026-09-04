```csharp
using (RequestHeaders.Use("cohere-api-key", cohereApiKey))
	results = await client.QueryAsync(
		collectionName: collectionName,
		query: new Image
		{
			Image_ = ImageToBase64Url("images/image-2.png"),
			Model = "cohere/embed-v4.0",
			Options = { ["output_dimension"] = 512 },
		},
		usingVector: "text",
		payloadSelector: true,
		limit: 1
	);

Console.WriteLine(results[0].Payload["caption"]);
```
