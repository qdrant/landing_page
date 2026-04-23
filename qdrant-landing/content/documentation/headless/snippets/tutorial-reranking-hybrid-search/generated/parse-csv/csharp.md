```csharp
async IAsyncEnumerable<(string title, string author, string description)> ParseCsv(string url)
{
	using var httpClient = new HttpClient();
	using var stream = await httpClient.GetStreamAsync(url);
	using var parser = new TextFieldParser(new StreamReader(stream));
	parser.TextFieldType = Microsoft.VisualBasic.FileIO.FieldType.Delimited;
	parser.SetDelimiters(",");
	string[]? headers = parser.ReadFields();
	int titleIdx = Array.IndexOf(headers!, "Title");
	int authorIdx = Array.IndexOf(headers!, "Author");
	int descriptionIdx = Array.IndexOf(headers!, "Description");
	while (!parser.EndOfData)
	{
		var fields = parser.ReadFields()!;
		yield return (fields[titleIdx], fields[authorIdx], fields[descriptionIdx]);
	}
}
```
