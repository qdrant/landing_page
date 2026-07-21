```go
checkGate := func() {
	// compare this pipeline's constants against what the collection records about itself
	info, err := client.GetCollectionInfo(context.Background(), COLLECTION)
	meta := info.GetConfig().GetMetadata()

	if meta["embedding_model"].GetStringValue() != MODEL || meta["pipeline_version"].GetStringValue() != PIPELINE {
		panic(fmt.Sprintf("collection was built by %v: full re-embed into a fresh collection required", meta))
	}
}
```
