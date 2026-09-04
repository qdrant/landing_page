```go
type Doc struct {
	Caption string
	Image   string
}

func imageToBase64Url(imagePath string) (string, error) {
	prefix := "data:image/png;base64"
	bytes, err := os.ReadFile(imagePath)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s,%s", prefix, base64.StdEncoding.EncodeToString(bytes)), nil
}

var documents = []Doc{
	{Caption: "An image about plane emergency safety.", Image: "images/image-1.png"},
	{Caption: "An image about airplane components.", Image: "images/image-2.png"},
	{Caption: "An image about COVID safety restrictions.", Image: "images/image-3.png"},
	{Caption: "A confidential image about UFO sightings.", Image: "images/image-4.png"},
	{Caption: "An image about unusual footprints on Aralar 2011.", Image: "images/image-5.png"},
}
```
