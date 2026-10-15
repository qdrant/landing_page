```go
import (
	"context"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

denseModel := "sentence-transformers/all-minilm-l6-v2"
// NOTE: loadDataset is a user-defined function.
// Implement it to handle dataset loading as needed.
dataset := loadDataset("miriad/miriad-4.4M", "train[0:100]")
points := make([]*qdrant.PointStruct, 0, 100)

for _, item := range dataset {
	passage := item["passage_text"]
	point := &qdrant.PointStruct{
		Id: qdrant.NewID(uuid.New().String()),
		Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
			"dense_vector": qdrant.NewVectorDocument(&qdrant.Document{
				Text:  passage,
				Model: denseModel,
			}),
		}),
		// Used for BM25
		Payload: qdrant.NewValueMap(map[string]any{"passage_text": passage}),
	}
	points = append(points, point)
}
_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
	CollectionName: "{collection_name}",
	Points:         points,
})
```
