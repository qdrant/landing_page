package snippet

// @hide-start
import (
	"context"

	"github.com/qdrant/go-client/qdrant"
)

// @hide-end
func Main() {
	//@hide-start
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
	})

	if err != nil {
		panic(err)
	}
	// @hide-end

	client.Upsert(context.Background(), &qdrant.UpsertPoints{
		CollectionName: "books",
		Points: []*qdrant.PointStruct{
			{
				Id: qdrant.NewIDNum(uint64(1)),
				Vectors: qdrant.NewVectorsMap(map[string]*qdrant.Vector{
					"title-bm25": qdrant.NewVectorDocument(&qdrant.Document{
						Model: "qdrant/bm25",
						Text:  "The Time Machine",
					}),
				}),
				Payload: qdrant.NewValueMap(map[string]any{
					"title":  "The Time Machine",
					"author": "H.G. Wells",
					"isbn":   "9780553213515",
				}),
			},
		},
	})

}
