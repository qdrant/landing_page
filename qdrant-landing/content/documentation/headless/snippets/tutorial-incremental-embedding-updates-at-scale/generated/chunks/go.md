```go
type Chunk struct {
	URL         string
	Anchor      string
	ChunkNum    int
	Text        string
	SectionURL  string // derived in prepare
	ContentHash string // derived in prepare
	PointID     string // derived in prepare
}

CHUNKS := []Chunk{
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "prerequisites",
		ChunkNum: 0,
		Text:     "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
	},
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-2-enable-tls",
		ChunkNum: 0,
		Text:     "Step 2: Enable TLS. Generate a local self-signed certificate and point Qdrant at it ...",
	},
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-3-enable-an-admin-api-key",
		ChunkNum: 0,
		Text:     "Step 3: Enable an Admin API Key. Without authentication, anyone with network access ...",
	},
}
```
