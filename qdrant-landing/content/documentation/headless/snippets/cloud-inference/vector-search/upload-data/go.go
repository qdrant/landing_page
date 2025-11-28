package snippet

// @hide-start
import (
	"context"

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

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
	bm25Model := "qdrant/bm25"
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
				"bm25_sparse_vector": qdrant.NewVectorDocument(&qdrant.Document{
					Text:  passage,
					Model: bm25Model,
				}),
			}),
		}
		points = append(points, point)
	}
	_, err = client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "{collection_name}",
		Points:         points,
	})
}
