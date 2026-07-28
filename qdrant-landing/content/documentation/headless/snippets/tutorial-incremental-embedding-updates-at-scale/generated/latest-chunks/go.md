```go
LATEST := []Chunk{
	// unchanged
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "prerequisites",
		ChunkNum: 0,
		Text:     "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
	},
	// edited text
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-2-enable-tls",
		ChunkNum: 0,
		Text:     "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ...",
	},
	// step-3 removed; new step-4 added
	{
		URL:      "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor:   "step-4-restrict-access",
		ChunkNum: 0,
		Text:     "Step 4: Restrict access with read-only API keys for untrusted clients ...",
	},
}
```
