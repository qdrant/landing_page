```go
// Replace the host and API key with your own from https://cloud.qdrant.io
client, err := qdrant.NewClient(&qdrant.Config{
	Host:   "xyz-example.qdrant.io",
	APIKey: "<your-api-key>",
	UseTLS: true,
})
```
