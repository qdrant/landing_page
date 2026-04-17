```go
csvUrl := "https://raw.githubusercontent.com/qdrant/examples/refs/heads/master/sci-fi-books/top_100_scifi_books_full.csv"

batchSize := 25
var idx uint64
var buffer []*qdrant.PointStruct

err = parseCSV(csvUrl, func(row CSVRow) {
	title := row.Title
	author := row.Author
	description := row.Description

	buffer = append(buffer, &qdrant.PointStruct{
		Id: qdrant.NewIDNum(idx),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"dense":  qdrant.NewVectorDocument(&qdrant.Document{Text: description, Model: denseEmbeddingModel}),
			"sparse": qdrant.NewVectorDocument(&qdrant.Document{Text: description, Model: sparseEmbeddingModel}),
			"multi":  qdrant.NewVectorDocument(&qdrant.Document{Text: description, Model: lateInteractionEmbeddingModel}),
		}),
		Payload: qdrant.NewValueMap(map[string]any{
			"title":       title,
			"author":      author,
			"description": description,
		}),
	})
	idx++

	if len(buffer) >= batchSize {
		client.Upsert(context.Background(), &qdrant.UpsertPoints{
			CollectionName: collectionName,
			Points:         buffer,
		})
		buffer = nil
	}
})

if len(buffer) > 0 {
	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: collectionName,
		Points:         buffer,
	})
}
```
