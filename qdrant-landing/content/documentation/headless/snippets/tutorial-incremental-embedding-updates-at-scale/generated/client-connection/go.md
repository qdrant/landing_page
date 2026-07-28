```go
// The Go client takes a host and port rather than a URL, so only the API key is read
// from the environment. Replace the host with your own from https://cloud.qdrant.io
client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.qdrant.io",
	APIKey: os.Getenv("QDRANT_API_KEY"),
	UseTLS: true,
})
```
