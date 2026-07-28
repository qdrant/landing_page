```csharp
var latest = Prepare(LATEST);
var source = ComputeDigests(latest); // digests of the edited source
var stored = await ReadMeta();       // digests Qdrant currently holds

var changedBuckets = new List<int>();
for (var b = 0; b < N_BUCKETS; b++)
	if (source[b] != stored[b])
		changedBuckets.Add(b);

Console.WriteLine(string.Join(", ", changedBuckets));
```
