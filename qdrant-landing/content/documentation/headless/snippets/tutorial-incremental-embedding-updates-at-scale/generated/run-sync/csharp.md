```csharp
var run = await Sync(LATEST);
Console.WriteLine(
	$"changed_buckets: [{string.Join(", ", run.changedBuckets)}], added: {run.added}, " +
	$"re_embedded: {run.reEmbedded}, deleted: {run.deleted}");
```
