```csharp
static string ImageToBase64Url(string imagePath)
{
	string prefix = "data:image/png;base64";
	byte[] bytes = File.ReadAllBytes(imagePath);
	return $"{prefix},{Convert.ToBase64String(bytes)}";
}

var documents = new[]
{
	new { Caption = "An image about plane emergency safety.", Image = "images/image-1.png" },
	new { Caption = "An image about airplane components.", Image = "images/image-2.png" },
	new { Caption = "An image about COVID safety restrictions.", Image = "images/image-3.png" },
	new { Caption = "A confidential image about UFO sightings.", Image = "images/image-4.png" },
	new { Caption = "An image about unusual footprints on Aralar 2011.", Image = "images/image-5.png" },
};
```
