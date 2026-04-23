```csharp
async IAsyncEnumerable<(string text, string datetime)> ParseCsv(string url)
{
	using var httpClient = new HttpClient();
	using var stream = await httpClient.GetStreamAsync(url);
	using var parser = new TextFieldParser(new StreamReader(stream));
	parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
	parser.SetDelimiters(",");
	string[]? headers = parser.ReadFields();
	int textIdx = Array.IndexOf(headers!, "text");
	int datetimeIdx = Array.IndexOf(headers!, "datetime");
	while (!parser.EndOfData)
	{
		var fields = parser.ReadFields()!;
		yield return (fields[textIdx], fields[datetimeIdx]);
	}
}
```
