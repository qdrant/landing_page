```go
QDRANT_URL := os.Getenv("QDRANT_URL")
QDRANT_API_KEY := os.Getenv("QDRANT_API_KEY")

client, err := qdrant.NewClient(&qdrant.Config{
	Host:   QDRANT_URL,
	APIKey: QDRANT_API_KEY,
	UseTLS: true,
})
```
