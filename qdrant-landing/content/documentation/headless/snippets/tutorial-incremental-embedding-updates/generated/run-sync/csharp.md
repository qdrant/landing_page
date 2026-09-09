```csharp
var run = await Sync(LATEST_CHUNKS);
foreach (var (op, count) in run)
	Console.WriteLine($"{op}: {count}");
```
