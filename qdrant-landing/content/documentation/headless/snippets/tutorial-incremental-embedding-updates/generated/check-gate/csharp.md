```csharp
async Task CheckGate()
{
	// compare this pipeline's constants against what the collection records about itself
	var meta = (await client.GetCollectionInfoAsync(COLLECTION)).Config.Metadata;
	var model = meta.GetValueOrDefault("embedding_model")?.StringValue;
	var pipeline = meta.GetValueOrDefault("pipeline_version")?.StringValue;

	if (model != MODEL || pipeline != PIPELINE)
		throw new InvalidOperationException(
			$"collection was built by {model}/{pipeline}: full re-embed into a fresh collection required");
}
```
