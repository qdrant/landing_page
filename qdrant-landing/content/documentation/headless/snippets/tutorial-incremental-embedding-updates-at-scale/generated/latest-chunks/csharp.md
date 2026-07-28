```csharp
var LATEST = new List<Chunk>
{
	// unchanged
	(
		Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor: "prerequisites",
		ChunkNum: 0,
		Text: "Prerequisites - Docker and Docker Compose installed - curl available in your terminal ...",
		SectionUrl: "", ContentHash: "", PointId: ""
	),
	// edited text
	(
		Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor: "step-2-enable-tls",
		ChunkNum: 0,
		Text: "Step 2: Enable TLS. Generate a certificate with mkcert and set the TLS config keys ...",
		SectionUrl: "", ContentHash: "", PointId: ""
	),
	// step-3 removed; new step-4 added
	(
		Url: "https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/",
		Anchor: "step-4-restrict-access",
		ChunkNum: 0,
		Text: "Step 4: Restrict access with read-only API keys for untrusted clients ...",
		SectionUrl: "", ContentHash: "", PointId: ""
	),
};
```
