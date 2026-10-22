package snippet

import (
	"context"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

// @hide-start
func loadDataset(name string, split string) []map[string]string {
	return []map[string]string{}
}
// @hide-end

func Main() {
	// @hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})
	if err != nil { panic(err) }
	// @hide-end

	denseModel := "sentence-transformers/all-minilm-l6-v2"
	// NOTE: loadDataset is a user-defined function.
	// Implement it to return 100 random rows with distinct passages, as the Python version does.
	dataset := loadDataset("miriad/miriad-4.4M", "train")
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
			Payload: qdrant.NewValueMap(map[string]any{
				"passage_text": passage,
				"question":     item["question"],
			}),
		}
		points = append(points, point)
	}
	_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points:         points,
	})
	if err != nil {
		panic(err)
	}
}
